'use client';

import React, { useMemo } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import { useAssetTree } from '@/hooks/useApi';

interface GembaCanvasProps {
  onSelectAsset?: (asset: any) => void;
}

export default function GembaCanvas({ onSelectAsset }: GembaCanvasProps = {}) {
  const { data: treeData, isLoading } = useAssetTree();

  const assets = useMemo(() => {
    const flatten = (nodes: any[]): any[] => {
      let result: any[] = [];
      nodes.forEach(node => {
        result.push(node);
        if (node.children && node.children.length > 0) {
          result = result.concat(flatten(node.children));
        }
      });
      return result;
    };
    return flatten(treeData);
  }, [treeData]);

  const getStatusColor = (status: string) => {
    if (status === 'Running') return '#10b981'; // emerald-500
    if (status === 'Warning') return '#f59e0b'; // amber-500
    if (status === 'Down') return '#ef4444'; // red-500
    return '#94a3b8'; // slate-400
  };

  if (isLoading) {
    return <div className="h-[600px] flex items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200">Loading Canvas...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Assembly Lane A Layout</h3>
        <div className="flex space-x-4 text-sm">
          <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div> Running</span>
          <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div> Down</span>
        </div>
      </div>
      
      {/* Drafting Paper Background */}
      <div 
        className="w-full relative" 
        style={{ 
          height: 600, 
          backgroundImage: 'linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          backgroundColor: '#f8fafc'
        }}
      >
        <Stage width={800} height={600}>
          <Layer>
            {assets.map((asset, i) => {
              const x = asset.posX || 100 + (i * 180);
              const y = asset.posY || 100 + (i * 80);
              const statusColor = getStatusColor(asset.attributes?.status);

              return (
                <Group 
                  key={asset.id} 
                  x={x} 
                  y={y} 
                  draggable
                  onDragEnd={(e) => {
                    console.log(`Moved ${asset.name} to x:${e.target.x()} y:${e.target.y()}`);
                  }}
                  onClick={() => onSelectAsset && onSelectAsset(asset)}
                  onTap={() => onSelectAsset && onSelectAsset(asset)}
                  className="cursor-pointer"
                >
                  {/* Card Shadow */}
                  <Rect width={160} height={70} fill="#000" opacity={0.05} cornerRadius={6} x={2} y={2} />
                  
                  {/* Card Body */}
                  <Rect width={160} height={70} fill="#ffffff" cornerRadius={6} stroke="#e2e8f0" strokeWidth={1} />
                  
                  {/* Status Indicator (Left Border) */}
                  <Rect width={6} height={70} fill={statusColor} cornerRadius={[6, 0, 0, 6]} />
                  
                  {/* Text */}
                  <Text text={asset.name} x={16} y={16} fontSize={14} fontStyle="bold" fill="#1e293b" width={134} wrap="none" ellipsis={true} />
                  
                  <Text text={asset.attributes?.status || 'Unknown'} x={16} y={40} fontSize={12} fill="#64748b" />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
