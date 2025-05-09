
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Minus, Plus, Columns, Book, Settings2 } from 'lucide-react'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

const ReaderControls = ({
  zoomLevel,
  onZoomChange,
  readingMode,
  onReadingModeChange,
  isVisible
}) => {
  if (!isVisible) return null;

  const handleZoomSliderChange = (value) => {
    onZoomChange(value[0]);
  };

  const incrementZoom = () => {
    onZoomChange(Math.min(zoomLevel + 10, 200));
  };

  const decrementZoom = () => {
    onZoomChange(Math.max(zoomLevel - 10, 25));
  };

  return (
    <div id="reader-controls-menu" className="fixed bottom-4 right-4 z-20 md:bottom-4 md:right-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full shadow-lg w-10 h-10 md:w-12 md:h-12 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-white">
            <Settings2 className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-56 sm:w-64 p-3 space-y-3 bg-neutral-800/90 backdrop-blur-md border-neutral-700/50 rounded-xl shadow-2xl mb-2 text-white"
          align="end"
          sideOffset={8}
        >
          <DropdownMenuLabel className="text-sm md:text-base font-semibold text-center">Options de Lecture</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-neutral-700" />

          <div>
            <p className="text-xs sm:text-sm font-medium mb-1.5 text-center">Zoom ({zoomLevel}%)</p>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={decrementZoom} 
                className="h-7 w-7 sm:h-8 sm:w-8 bg-neutral-700 border-neutral-600 hover:bg-neutral-600 text-white"
              >
                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Slider
                value={[zoomLevel]}
                onValueChange={handleZoomSliderChange}
                min={25}
                max={200}
                step={5}
                className="flex-grow [&>span:first-child]:bg-primary [&>span:first-child_span]:bg-white"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={incrementZoom} 
                className="h-7 w-7 sm:h-8 sm:w-8 bg-neutral-700 border-neutral-600 hover:bg-neutral-600 text-white"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>

          <DropdownMenuSeparator className="bg-neutral-700" />
          
          <div>
            <p className="text-xs sm:text-sm font-medium mb-1.5 text-center">Mode de Lecture</p>
            <DropdownMenuRadioGroup value={readingMode} onValueChange={onReadingModeChange}>
              <DropdownMenuRadioItem value="webtoon" className="flex items-center justify-between cursor-pointer p-1.5 sm:p-2 rounded-md hover:bg-neutral-700 focus:bg-neutral-600 text-xs sm:text-sm">
                <span>Webtoon (Continu)</span>
                <Book className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="horizontal" className="flex items-center justify-between cursor-pointer p-1.5 sm:p-2 rounded-md hover:bg-neutral-700 focus:bg-neutral-600 text-xs sm:text-sm">
                <span>Horizontal (Page par page)</span>
                <Columns className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ReaderControls;
