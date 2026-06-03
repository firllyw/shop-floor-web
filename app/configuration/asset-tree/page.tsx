'use client';

import React from 'react';
import { useAssetTree } from '@/hooks/useApi';
import { FolderOpen, Settings, Lock, Droplet, Plus } from 'lucide-react';

export default function AssetTreePage() {
  const { data: treeData, isLoading } = useAssetTree();

  const renderTree = (nodes: any[], level: number = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className="select-none">
        <div 
          className="flex items-center group px-4 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          <div className="mr-3 text-slate-400">
            {node.children && node.children.length > 0 ? (
              <FolderOpen className="w-5 h-5 text-blue-500" />
            ) : (
              <Settings className="w-5 h-5 text-slate-400" />
            )}
          </div>
          
          <div className="flex-1 flex items-center">
            <span className="font-medium text-slate-700">{node.name}</span>
            
            {/* Badges / Flags */}
            <div className="ml-4 flex items-center space-x-2">
              {node.attributes?.is_loto_required && (
                <div className="flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold" title="Requires LOTO">
                  <Lock className="w-3 h-3 mr-1" />
                  LOTO
                </div>
              )}
              {node.attributes?.is_lubrication_point && (
                <div className="flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold" title="Lubrication Point">
                  <Droplet className="w-3 h-3 mr-1" />
                  Lube
                </div>
              )}
            </div>
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Render children */}
        {node.children && node.children.length > 0 && (
          <div className="relative">
            {/* Tree Branch line */}
            <div 
              className="absolute left-0 top-0 bottom-0 border-l border-slate-200" 
              style={{ left: `${level * 24 + 25}px` }}
            ></div>
            {renderTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Asset Tree</h2>
          <p className="text-slate-500">Manage equipment hierarchy and bill of materials.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm transition">
          Add Root Asset
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 min-h-[500px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-slate-400">Loading asset tree...</div>
        ) : treeData.length > 0 ? (
          renderTree(treeData)
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">No assets found.</div>
        )}
      </div>
    </div>
  );
}
