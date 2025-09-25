import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, X, GripVertical } from 'lucide-react';

const MODELS = [
    { id: "google/gemini-2.5-flash", name: "Gemini" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o mini" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude" },
    { id: "meta-llama/llama-3-8b-instruct", name: "Llama" },
    { id: "deepseek/deepseek-chat", name: "DeepSeek Chat" },
    { id: "qwen/qwen-2.5-7b-instruct", name: "Qwen" },
    { id: "moonshotai/kimi-k2", name: "Kimi K2" },
];

const WhatsAppModelManager = ({ selectedModels, setSelectedModels, disabled }) => {
    const [draggedIndex, setDraggedIndex] = useState(null);

    const moveModel = (fromIndex, toIndex) => {
        const newOrder = [...selectedModels];
        const [movedModel] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, movedModel);
        setSelectedModels(newOrder);
    };

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== dropIndex) {
            moveModel(draggedIndex, dropIndex);
        }
        setDraggedIndex(null);
    };

    const toggleModel = (modelId) => {
        if (selectedModels.includes(modelId)) {
            setSelectedModels(selectedModels.filter(id => id !== modelId));
        } else {
            setSelectedModels([...selectedModels, modelId]);
        }
    };

    const getModelName = (modelId) => {
        return MODELS.find(m => m.id === modelId)?.name || modelId;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    className="bg-white rounded-whatsapp-full h-10 px-3 text-whatsapp-text-gray hover:bg-whatsapp-hover-gray border-0 shadow-none"
                >
                    <Menu className="h-4 w-4" />
                    <span className="ml-1 font-medium">{selectedModels.length}</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                side="left"
                sideOffset={8}
                className="w-80 bg-white border-whatsapp-border-gray shadow-lg rounded-lg max-h-96 overflow-y-auto z-[9999]"
                avoidCollisions={true}
            >
                {/* Active Models Section */}
                <div className="p-3">
                    <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Active Models (in order)
                    </h5>

                    {selectedModels.map((modelId, index) => (
                        <div
                            key={modelId}
                            className="flex items-center justify-between p-2 mb-1 bg-whatsapp-message-green border border-whatsapp-green rounded-md hover:bg-opacity-80 transition-all cursor-move"
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                        >
                            <div className="flex items-center flex-1">
                                <GripVertical className="h-3 w-3 text-gray-500 mr-2" />
                                <span className="text-sm font-medium text-whatsapp-text-gray">
                                    {getModelName(modelId)}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">
                                    #{index + 1}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleModel(modelId)}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Available Models Section */}
                {MODELS.filter(m => !selectedModels.includes(m.id)).length > 0 && (
                    <>
                        <DropdownMenuSeparator className="bg-gray-200" />
                        <div className="p-3">
                            <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                Available Models
                            </h5>

                            {MODELS.filter(m => !selectedModels.includes(m.id)).map((model) => (
                                <DropdownMenuItem
                                    key={model.id}
                                    onClick={() => toggleModel(model.id)}
                                    className="flex items-center justify-between p-2 mb-1 bg-gray-50 hover:bg-gray-100 rounded-md cursor-pointer"
                                >
                                    <span className="text-sm text-whatsapp-text-gray">
                                        {model.name}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-whatsapp-green hover:text-whatsapp-dark-green hover:bg-green-50 rounded-full ml-2"
                                    >
                                        <span className="text-sm font-bold">+</span>
                                    </Button>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default WhatsAppModelManager;