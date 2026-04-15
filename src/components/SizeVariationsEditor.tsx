import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SizeVariation, ColorVariation } from '@/types';
import { 
  Plus, 
  X, 
  Palette, 
  ChevronDown, 
  ChevronRight,
  Shirt,
  Footprints
} from 'lucide-react';

// Size presets for different product types
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const SHOE_SIZES = ['32', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];
const COMMON_COLORS = [
  'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 
  'Brown', 'Gray', 'Navy', 'Beige', 'Burgundy', 'Teal', 'Gold', 'Silver'
];

interface SizeVariationsEditorProps {
  variations: SizeVariation[];
  setVariations: (variations: SizeVariation[]) => void;
  expandedSizes: Set<number>;
  setExpandedSizes: (expanded: Set<number>) => void;
  formErrors?: string;
  showToast: (message: string) => void;
}

export function SizeVariationsEditor({
  variations,
  setVariations,
  expandedSizes,
  setExpandedSizes,
  formErrors,
  showToast
}: SizeVariationsEditorProps) {
  const toggleSize = (index: number) => {
    const next = new Set(expandedSizes);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedSizes(next);
  };

  const addSize = () => {
    const newSize: SizeVariation = { size: '', stock: 0, colors: [] };
    setVariations([...variations, newSize]);
    setExpandedSizes(new Set([...expandedSizes, variations.length]));
  };

  const addSizePreset = (size: string) => {
    if (variations.some(v => v.size === size)) {
      showToast(`Size "${size}" already exists`);
      return;
    }
    const newSize: SizeVariation = { size, stock: 0, colors: [{ name: '', stock: 0, imageUrl: '' }] };
    setVariations([...variations, newSize]);
    setExpandedSizes(new Set([...expandedSizes, variations.length]));
  };

  const addAllPresets = (sizes: string[]) => {
    const newVariations: SizeVariation[] = sizes
      .filter(size => !variations.some(v => v.size === size))
      .map(size => ({ size, stock: 0, colors: [{ name: '', stock: 0, imageUrl: '' }] }));
    
    if (newVariations.length === 0) {
      showToast('All preset sizes already exist');
      return;
    }

    setVariations([...variations, ...newVariations]);
    setExpandedSizes(new Set([...expandedSizes, ...newVariations.map((_, i) => variations.length + i)]));
  };

  const removeSize = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const updateSize = (index: number, field: keyof SizeVariation, value: string | number | ColorVariation[]) => {
    const updated = [...variations];
    updated[index] = { ...updated[index], [field]: value };
    setVariations(updated);
  };

  const addColor = (sizeIndex: number) => {
    const updated = [...variations];
    updated[sizeIndex].colors.push({ name: '', stock: 0, imageUrl: '' });
    setVariations(updated);
  };

  const removeColor = (sizeIndex: number, colorIndex: number) => {
    const updated = [...variations];
    updated[sizeIndex].colors = updated[sizeIndex].colors.filter((_, i) => i !== colorIndex);
    setVariations(updated);
  };

  const updateColor = (sizeIndex: number, colorIndex: number, field: keyof ColorVariation, value: string | number) => {
    const updated = [...variations];
    updated[sizeIndex].colors[colorIndex] = { ...updated[sizeIndex].colors[colorIndex], [field]: value };
    setVariations(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Palette className="h-5 w-5" />
          Sizes & Colors <span className="text-destructive">*</span>
        </Label>
      </div>

      {/* Size Preset Buttons */}
      <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm font-medium mb-2">Quick Add Sizes</p>
        <div className="flex gap-2 flex-wrap">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => addAllPresets(CLOTHING_SIZES)}
            className="flex items-center gap-1"
          >
            <Shirt className="h-3 w-3" />
            Clothing (XS-XXXL)
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => addAllPresets(SHOE_SIZES)}
            className="flex items-center gap-1"
          >
            <Footprints className="h-3 w-3" />
            Shoes (32-48)
          </Button>
        </div>
        
        {/* Individual size buttons for clothing */}
        <div className="pt-2 border-t mt-2">
          <p className="text-xs text-muted-foreground mb-2">Clothing sizes:</p>
          <div className="flex gap-1 flex-wrap">
            {CLOTHING_SIZES.map((size) => {
              const exists = variations.some(v => v.size === size);
              return (
                <Button
                  key={size}
                  type="button"
                  variant={exists ? 'secondary' : 'outline'}
                  size="sm"
                  className="h-7 min-w-[2.5rem] px-2 text-xs"
                  disabled={exists}
                  onClick={() => addSizePreset(size)}
                  title={exists ? `Size ${size} already added` : `Add size ${size}`}
                >
                  {size}
                  {exists && <X className="h-2 w-2 ml-1" />}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Individual size buttons for shoes */}
        <div className="pt-2 border-t mt-2">
          <p className="text-xs text-muted-foreground mb-2">Shoe sizes:</p>
          <div className="flex gap-1 flex-wrap">
            {SHOE_SIZES.map((size) => {
              const exists = variations.some(v => v.size === size);
              return (
                <Button
                  key={size}
                  type="button"
                  variant={exists ? 'secondary' : 'outline'}
                  size="sm"
                  className="h-7 min-w-[2.5rem] px-2 text-xs"
                  disabled={exists}
                  onClick={() => addSizePreset(size)}
                  title={exists ? `Size ${size} already added` : `Add size ${size}`}
                >
                  {size}
                  {exists && <X className="h-2 w-2 ml-1" />}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {formErrors && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{formErrors}</p>
      )}

      {variations.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Palette className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No sizes added yet</p>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addSize}>
            <Plus className="h-3 w-3 mr-1" /> Add Size Manually
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {variations.length} size{variations.length !== 1 ? 's' : ''} added
            </p>
            <Button type="button" variant="outline" size="sm" onClick={addSize}>
              <Plus className="h-3 w-3 mr-1" /> Add Custom Size
            </Button>
          </div>

          {variations.map((variation, sizeIndex) => (
            <div key={sizeIndex} className="border rounded-lg overflow-hidden shadow-sm">
              {/* Size Header */}
              <div className="flex items-center gap-2 p-3 bg-muted/70">
                <button
                  type="button"
                  onClick={() => toggleSize(sizeIndex)}
                  className="p-1 hover:bg-background rounded transition-colors"
                >
                  {expandedSizes.has(sizeIndex) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <Input
                  placeholder="Size name"
                  value={variation.size}
                  onChange={(e) => updateSize(sizeIndex, 'size', e.target.value)}
                  className="flex-1 h-9 font-semibold"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Stock:</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={variation.stock || ''}
                    onChange={(e) => updateSize(sizeIndex, 'stock', parseInt(e.target.value) || 0)}
                    className="w-20 h-9"
                    min="0"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:bg-destructive/10"
                  onClick={() => removeSize(sizeIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Colors for this Size */}
              {expandedSizes.has(sizeIndex) && (
                <div className="p-3 space-y-2 border-t bg-background">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      Colors for {variation.size || 'this size'}
                    </p>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs" 
                      onClick={() => addColor(sizeIndex)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Color
                    </Button>
                  </div>

                  {/* Quick color buttons */}
                  {variation.colors.length === 0 && (
                    <div className="px-3 py-2 bg-muted/30 rounded">
                      <p className="text-xs text-muted-foreground mb-2">Quick add common colors:</p>
                      <div className="flex gap-1 flex-wrap">
                        {COMMON_COLORS.slice(0, 9).map((color) => {
                          const exists = variation.colors.some(c => c.name.toLowerCase() === color.toLowerCase());
                          return (
                            <Button
                              key={color}
                              type="button"
                              variant={exists ? 'secondary' : 'outline'}
                              size="sm"
                              className="h-6 text-xs px-2"
                              disabled={exists}
                              onClick={() => {
                                const updated = [...variations];
                                updated[sizeIndex].colors.push({ name: color, stock: 0, imageUrl: '' });
                                setVariations(updated);
                              }}
                            >
                              {color}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {variation.colors.map((color, colorIndex) => (
                    <div key={colorIndex} className="flex items-start gap-2 pl-4 p-2 bg-muted/20 rounded">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Color name"
                          value={color.name}
                          onChange={(e) => updateColor(sizeIndex, colorIndex, 'name', e.target.value)}
                          className="h-8 text-sm"
                        />
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            placeholder="Stock"
                            value={color.stock || ''}
                            onChange={(e) => updateColor(sizeIndex, colorIndex, 'stock', parseInt(e.target.value) || 0)}
                            className="h-8 text-sm flex-1"
                            min="0"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeColor(sizeIndex, colorIndex)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {variation.colors.length === 0 && (
                    <p className="text-xs text-muted-foreground pl-4 italic">No colors added yet</p>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Summary */}
          <div className="flex justify-between text-xs text-muted-foreground px-3 py-2 bg-muted/30 rounded">
            <span>Sizes: {variations.length}</span>
            <span>Colors: {variations.reduce((sum, v) => sum + v.colors.length, 0)}</span>
            <span className="font-semibold">Total Stock: {variations.reduce((sum, v) => sum + v.stock, 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
