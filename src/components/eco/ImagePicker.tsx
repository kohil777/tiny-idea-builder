import { useRef, type ReactNode } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImagePicker({ preview, onFile, disabled, label, icon }: { preview: string | null; onFile: (f: File) => void; disabled?: boolean; label: string; icon?: ReactNode }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={disabled}
        className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/60 transition hover:border-primary hover:bg-secondary disabled:opacity-60"
      >
        {preview ? (
          <img src={preview} alt="Selected" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            {icon ?? <Camera className="size-8" />}
            <span className="text-sm font-medium">{label}</span>
          </span>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      {preview && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => ref.current?.click()} disabled={disabled}>
          <Upload /> Choose another
        </Button>
      )}
    </div>
  );
}
