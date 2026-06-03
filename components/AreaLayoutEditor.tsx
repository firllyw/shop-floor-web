"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Stage, Layer, Rect, Text, Group, Transformer } from "react-konva";
import api from "@/lib/api";
import { Save, PlusSquare, Map, Settings2 } from "lucide-react";
import { useModal } from "@/components/ModalProvider";

interface AreaLayoutEditorProps {
  areaId: string;
}

const RectangleNode = ({ shapeProps, isSelected, onSelect, onChange }: any) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <Group
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          node.scaleX(1);
          node.scaleY(1);

          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          });
        }}
      >
        {/* Zone Background */}
        {shapeProps.type === 'zone' && (
          <Rect
            width={shapeProps.width}
            height={shapeProps.height}
            fill={shapeProps.color || "rgba(59, 130, 246, 0.2)"}
            stroke={shapeProps.stroke || "#3b82f6"}
            strokeWidth={2}
            dash={[5, 5]}
          />
        )}
        
        {/* Machine Card */}
        {shapeProps.type === 'machine' && (
          <>
            <Rect width={shapeProps.width} height={shapeProps.height} fill="#000" opacity={0.05} cornerRadius={6} x={2} y={2} />
            <Rect width={shapeProps.width} height={shapeProps.height} fill="#ffffff" cornerRadius={6} stroke="#e2e8f0" strokeWidth={1} />
            <Rect width={6} height={shapeProps.height} fill={shapeProps.statusColor || "#94a3b8"} cornerRadius={[6, 0, 0, 6]} />
          </>
        )}

        <Text
          text={shapeProps.name}
          x={shapeProps.type === 'machine' ? 16 : 10}
          y={shapeProps.type === 'machine' ? 16 : 10}
          fontSize={shapeProps.type === 'machine' ? 14 : 20}
          fontStyle="bold"
          fill={shapeProps.type === 'machine' ? "#1e293b" : "#1e40af"}
          width={shapeProps.width - 20}
          wrap="none"
          ellipsis={true}
        />
        
        {shapeProps.type === 'machine' && (
           <Text text={shapeProps.status || 'Ready'} x={16} y={40} fontSize={12} fill="#64748b" />
        )}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 50 || newBox.height < 50) return oldBox;
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

export default function AreaLayoutEditor({ areaId }: AreaLayoutEditorProps) {
  const stageRef = useRef<any>(null);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showAlert, showConfirm } = useModal();

  useEffect(() => {
    fetchData();
  }, [areaId]);

  const fetchData = async () => {
    try {
      const areaRes = await api.get(`/areas/${areaId}`);
      if (areaRes.data.layoutState && areaRes.data.layoutState.zones) {
        setZones(areaRes.data.layoutState.zones);
      }

      const treeRes = await api.get(`/assets/tree`);
      const flatten = (nodes: any[]): any[] => {
        let result: any[] = [];
        nodes.forEach((node) => {
          result.push(node);
          if (node.children) result = result.concat(flatten(node.children));
        });
        return result;
      };
      setAllAssets(flatten(treeRes.data));
    } catch (error) {
      console.error("Failed to fetch layout data", error);
    }
  };

  const placedAssets = allAssets.filter(a => a.areaId === areaId && a.posX !== null && a.posY !== null);
  const unplacedAssets = allAssets.filter(a => (a.areaId === areaId && (a.posX === null || a.posY === null)) || !a.areaId);

  const handleDrop = async (e: any) => {
    e.preventDefault();
    if (!stageRef.current) return;

    stageRef.current.setPointersPositions(e);
    const pos = stageRef.current.getPointerPosition();
    const type = e.dataTransfer.getData("type");

    if (type === "existing_machine") {
      const assetId = e.dataTransfer.getData("assetId");
      setAllAssets(allAssets.map(a => 
        a.id === assetId 
          ? { ...a, areaId: areaId, posX: pos.x, posY: pos.y }
          : a
      ));
    } else if (type === "zone") {
      const newZone = {
        id: `zone_${Date.now()}`,
        type: "zone",
        name: "New Area Zone",
        x: pos.x,
        y: pos.y,
        width: 300,
        height: 200,
        rotation: 0,
        color: "rgba(244, 63, 94, 0.1)",
        stroke: "#f43f5e"
      };
      setZones([...zones, newZone]);
    }
  };

  const handleSaveLayout = async () => {
    setIsSaving(true);
    try {
      const assetPayload = placedAssets.map((a) => {
        const attrs = a.attributes || {};
        return {
          id: a.id,
          areaId: a.areaId,
          posX: a.posX,
          posY: a.posY,
          width: attrs.width,
          height: attrs.height,
          rotation: attrs.rotation,
        };
      });
      if (assetPayload.length > 0) {
        await api.put("/assets/positions", assetPayload);
      }

      await api.put(`/areas/${areaId}/layout`, {
        layoutState: { zones },
      });

      showAlert("Success", "Layout saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save layout", error);
      showAlert("Error", "Failed to save layout.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "Running") return "#10b981";
    if (status === "Warning") return "#f59e0b";
    if (status === "Down") return "#ef4444";
    return "#94a3b8";
  };

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  const machineShapes = placedAssets.map((a) => {
    const attrs = a.attributes || {};
    return {
      id: a.id,
      type: "machine",
      name: a.name,
      status: attrs.status,
      statusColor: getStatusColor(attrs.status),
      x: a.posX,
      y: a.posY,
      width: attrs.width ?? 160,
      height: attrs.height ?? 70,
      rotation: attrs.rotation ?? 0,
    };
  });

  const handleShapeChange = (id: string, newProps: any) => {
    if (newProps.type === "machine") {
      setAllAssets(
        allAssets.map((a) =>
          a.id === id
            ? { ...a, posX: newProps.x, posY: newProps.y, attributes: { ...a.attributes, width: newProps.width, height: newProps.height, rotation: newProps.rotation } }
            : a
        )
      );
    } else {
      setZones(zones.map((z) => (z.id === id ? newProps : z)));
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      if (selectedId.startsWith('zone_')) {
        setZones(zones.filter(z => z.id !== selectedId));
        setSelectedId(null);
      } else {
        showConfirm(
          "Remove Machine",
          "Remove this machine from the layout? It will return to the unplaced list.",
          () => {
            api.put(`/assets/positions`, [{ id: selectedId, posX: null, posY: null, areaId: null }])
            .then(() => {
               setAllAssets(allAssets.map(a => a.id === selectedId ? { ...a, areaId: null, posX: null, posY: null } : a));
               setSelectedId(null);
            });
          }
        );
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="flex flex-col space-y-4">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 bg-white border px-3 py-2 rounded-lg cursor-grab shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
             draggable
             onDragStart={(e) => {
               e.dataTransfer.setData("type", "zone");
             }}>
          <Map className="w-4 h-4 text-pink-500" />
          <span>Drag New Zone</span>
        </div>

        <button
          onClick={handleSaveLayout}
          disabled={isSaving}
          className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg flex items-center shadow-sm font-medium transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Layout"}
        </button>
      </div>

      {/* Editor Properties Panel (if zone selected) */}
      {selectedId && selectedId.startsWith('zone_') && (
        <div className="flex items-center space-x-4 bg-white p-3 rounded-lg border text-sm">
          <span className="font-semibold text-gray-700">Edit Zone:</span>
          <input
            type="text"
            className="border rounded px-2 py-1 outline-none"
            value={zones.find(z => z.id === selectedId)?.name || ''}
            onChange={(e) => {
              setZones(zones.map(z => z.id === selectedId ? { ...z, name: e.target.value } : z));
            }}
            placeholder="Zone Name"
          />
          <select 
            className="border rounded px-2 py-1 outline-none"
            value={zones.find(z => z.id === selectedId)?.color || ''}
            onChange={(e) => {
              const val = e.target.value;
              const stroke = val.replace('0.2', '1.0').replace('0.1', '1.0');
              setZones(zones.map(z => z.id === selectedId ? { ...z, color: val, stroke } : z));
            }}
          >
            <option value="rgba(59, 130, 246, 0.2)">Blue Zone</option>
            <option value="rgba(244, 63, 94, 0.1)">Red Zone</option>
            <option value="rgba(16, 185, 129, 0.2)">Green Zone</option>
            <option value="rgba(245, 158, 11, 0.2)">Yellow Zone</option>
          </select>
          <span className="text-gray-400 italic text-xs ml-auto">Press Delete to remove</span>
        </div>
      )}

      {/* Two Pane Layout: Sidebar for unplaced machines, Main for Canvas */}
      <div className="flex space-x-4">
        {/* Sidebar: Unplaced Master Data */}
        <div className="w-64 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
          <div className="bg-gray-50 border-b p-3 font-semibold text-gray-700 flex items-center justify-between text-sm">
            <span>Unplaced Machines</span>
            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">{unplacedAssets.length}</span>
          </div>
          <div className="p-3 overflow-y-auto max-h-[600px] space-y-2">
            {unplacedAssets.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">All machines placed!</p>
            ) : (
              unplacedAssets.map(asset => (
                <div
                  key={asset.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("type", "existing_machine");
                    e.dataTransfer.setData("assetId", asset.id);
                  }}
                  className="bg-white border rounded-lg p-3 cursor-grab shadow-sm hover:border-blue-300 hover:shadow transition-all"
                >
                  <div className="flex items-center text-sm font-medium text-gray-800 mb-1">
                    <Settings2 className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="truncate">{asset.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center justify-between">
                    <span>{asset.areaId ? 'Assigned' : 'Unassigned'}</span>
                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Drag</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div
          className="flex-1 relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner"
          style={{
            height: 600,
            backgroundImage:
              "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Stage
            width={1200}
            height={800}
            onMouseDown={checkDeselect}
            onTouchStart={checkDeselect}
            ref={stageRef}
          >
            <Layer>
              {zones.map((zone) => (
                <RectangleNode
                  key={zone.id}
                  shapeProps={zone}
                  isSelected={zone.id === selectedId}
                  onSelect={() => setSelectedId(zone.id)}
                  onChange={(newProps: any) => handleShapeChange(zone.id, newProps)}
                />
              ))}
            </Layer>
            <Layer>
              {machineShapes.map((machine) => (
                <RectangleNode
                  key={machine.id}
                  shapeProps={machine}
                  isSelected={machine.id === selectedId}
                  onSelect={() => setSelectedId(machine.id)}
                  onChange={(newProps: any) => handleShapeChange(machine.id, newProps)}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}
