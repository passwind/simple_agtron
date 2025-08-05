import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Calendar, TrendingUp, BarChart3, Trash2, Share2, Download } from 'lucide-react';
import { useDetectionStore, useDetectionRecords, useDetectionStats } from '../store/useDetectionStore';
import type { DetectionRecord } from '../store/useDetectionStore';

type SortOption = 'newest' | 'oldest' | 'agtron_asc' | 'agtron_desc' | 'confidence';
type FilterOption = 'all' | '极浅烘' | '浅烘' | '中浅烘' | '中烘' | '中深烘' | '深烘' | '极深烘';

export default function History() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  
  const { user, removeDetectionRecord, clearDetectionRecords } = useDetectionStore();
  const { loadDetectionRecords } = useDetectionStore();
  const detectionRecords = useDetectionRecords();
  const stats = useDetectionStats();

  useEffect(() => {
    // 如果用户已登录，加载检测记录
    if (user.isAuthenticated) {
      loadDetectionRecords();
    }
  }, [user.isAuthenticated, loadDetectionRecords]);

  // 过滤和排序记录
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = detectionRecords;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.roast_level.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.suggestions.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.agtron_value.toString().includes(searchTerm)
      );
    }

    // 烘焙度过滤
    if (filterBy !== 'all') {
      filtered = filtered.filter(record => record.roast_level === filterBy);
    }

    // 排序
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'agtron_asc':
          return a.agtron_value - b.agtron_value;
        case 'agtron_desc':
          return b.agtron_value - a.agtron_value;
        case 'confidence':
          return b.confidence - a.confidence;
        default:
          return 0;
      }
    });

    return sorted;
  }, [detectionRecords, searchTerm, sortBy, filterBy]);

  // 获取烘焙度颜色
  const getRoastLevelColor = (level: string) => {
    switch (level) {
      case '极浅烘':
      case '浅烘':
        return 'bg-yellow-100 text-yellow-800';
      case '中浅烘':
      case '中烘':
        return 'bg-orange-100 text-orange-800';
      case '中深烘':
      case '深烘':
        return 'bg-coffee-100 text-coffee-800';
      case '极深烘':
        return 'bg-coffee-200 text-coffee-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 删除选中的记录
  const handleDeleteSelected = () => {
    if (selectedRecords.length === 0) return;
    
    if (confirm(`确定要删除选中的 ${selectedRecords.length} 条记录吗？`)) {
      selectedRecords.forEach(id => removeDetectionRecord(id));
      setSelectedRecords([]);
    }
  };

  // 清空所有记录
  const handleClearAll = () => {
    if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
      clearDetectionRecords();
      setSelectedRecords([]);
    }
  };

  // 导出数据
  const handleExport = () => {
    const dataToExport = selectedRecords.length > 0 
      ? detectionRecords.filter(record => selectedRecords.includes(record.id))
      : filteredAndSortedRecords;
    
    const csvContent = [
      ['时间', 'Agtron值', '烘焙度', '置信度', '建议'].join(','),
      ...dataToExport.map(record => [
        new Date(record.created_at).toLocaleString('zh-CN'),
        record.agtron_value,
        record.roast_level,
        (record.confidence * 100).toFixed(1) + '%',
        `"${record.suggestions}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `咖啡检测记录_${new Date().toLocaleDateString('zh-CN')}.csv`;
    link.click();
  };

  // 切换记录选择
  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecords(prev => 
      prev.includes(recordId) 
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedRecords.length === filteredAndSortedRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredAndSortedRecords.map(record => record.id));
    }
  };

  return (
    <div className="p-4 pb-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-coffee-950 mb-6 text-center">
          📊 历史记录
        </h1>

        {/* 统计概览 */}
        {stats.totalDetections > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-coffee-950">统计概览</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-coffee-950">{stats.totalDetections}</div>
                <div className="text-sm text-coffee-600">总检测次数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-orange">{stats.averageAgtron}</div>
                <div className="text-sm text-coffee-600">平均Agtron值</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-coffee-950">{stats.mostCommonRoastLevel}</div>
                <div className="text-sm text-coffee-600">最常烘焙度</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-accent-green">
                  {(stats.averageConfidence * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-coffee-600">平均置信度</div>
              </div>
            </div>
          </div>
        )}

        {/* 搜索和过滤 */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          {/* 搜索框 */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-coffee-400" size={20} />
            <input
              type="text"
              placeholder="搜索烘焙度、Agtron值或建议..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-coffee-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
            />
          </div>

          {/* 过滤器切换 */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-coffee-600 hover:text-coffee-800"
            >
              <Filter size={16} />
              筛选选项
            </button>
            
            <div className="flex gap-2">
              {selectedRecords.length > 0 && (
                <>
                  <button
                    onClick={handleDeleteSelected}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="删除选中"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={handleExport}
                    className="text-coffee-600 hover:text-coffee-800 p-1"
                    title="导出选中"
                  >
                    <Download size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 过滤选项 */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-coffee-100 space-y-3">
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">排序方式</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 border border-coffee-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
                >
                  <option value="newest">最新优先</option>
                  <option value="oldest">最早优先</option>
                  <option value="agtron_desc">Agtron值 高→低</option>
                  <option value="agtron_asc">Agtron值 低→高</option>
                  <option value="confidence">置信度优先</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">烘焙度筛选</label>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                  className="w-full px-3 py-2 border border-coffee-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
                >
                  <option value="all">全部烘焙度</option>
                  <option value="极浅烘">极浅烘</option>
                  <option value="浅烘">浅烘</option>
                  <option value="中浅烘">中浅烘</option>
                  <option value="中烘">中烘</option>
                  <option value="中深烘">中深烘</option>
                  <option value="深烘">深烘</option>
                  <option value="极深烘">极深烘</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 批量操作 */}
        {filteredAndSortedRecords.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedRecords.length === filteredAndSortedRecords.length && filteredAndSortedRecords.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-coffee-300 text-accent-orange focus:ring-accent-orange"
                />
                <span className="text-sm text-coffee-600">
                  {selectedRecords.length > 0 ? `已选择 ${selectedRecords.length} 项` : '全选'}
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="text-coffee-600 hover:text-coffee-800 text-sm flex items-center gap-1"
                >
                  <Download size={14} />
                  导出
                </button>
                <button
                  onClick={handleClearAll}
                  className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  清空
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 记录列表 */}
        <div className="space-y-4">
          {filteredAndSortedRecords.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-coffee-400 mb-4">
                <BarChart3 size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-coffee-950 mb-2">
                {detectionRecords.length === 0 ? '暂无检测记录' : '没有找到匹配的记录'}
              </h3>
              <p className="text-coffee-600 text-sm">
                {detectionRecords.length === 0 
                  ? '开始您的第一次咖啡豆检测吧！' 
                  : '尝试调整搜索条件或筛选选项'}
              </p>
            </div>
          ) : (
            filteredAndSortedRecords.map((record) => (
              <div key={record.id} className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedRecords.includes(record.id)}
                    onChange={() => toggleRecordSelection(record.id)}
                    className="mt-1 rounded border-coffee-300 text-accent-orange focus:ring-accent-orange"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoastLevelColor(record.roast_level)}`}>
                          {record.roast_level}
                        </span>
                        <span className="text-sm text-coffee-500">
                          {formatDate(record.created_at)}
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-coffee-950">
                          {record.agtron_value}
                        </div>
                        <div className="text-xs text-coffee-500">Agtron</div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-coffee-600">置信度</span>
                        <span className="text-xs text-coffee-900 font-medium">
                          {(record.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-coffee-100 rounded-full h-1.5">
                        <div
                          className="bg-accent-green h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${record.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-coffee-700 leading-relaxed mb-3">
                      {record.suggestions}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: '咖啡豆检测记录',
                              text: `Agtron值: ${record.agtron_value}, 烘焙度: ${record.roast_level}, 建议: ${record.suggestions}`,
                            });
                          } else {
                            const shareText = `咖啡豆检测记录\nAgtron值: ${record.agtron_value}\n烘焙度: ${record.roast_level}\n建议: ${record.suggestions}`;
                            navigator.clipboard.writeText(shareText);
                            alert('记录已复制到剪贴板！');
                          }
                        }}
                        className="text-coffee-600 hover:text-coffee-800 text-sm flex items-center gap-1"
                      >
                        <Share2 size={14} />
                        分享
                      </button>
                      
                      <button
                        onClick={() => {
                          if (confirm('确定要删除这条记录吗？')) {
                            removeDetectionRecord(record.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 结果统计 */}
        {filteredAndSortedRecords.length > 0 && (
          <div className="mt-6 text-center text-sm text-coffee-500">
            显示 {filteredAndSortedRecords.length} / {detectionRecords.length} 条记录
          </div>
        )}
      </div>
    </div>
  );
}