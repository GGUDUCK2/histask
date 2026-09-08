import { useTheme } from '@/app/theme-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

/** Development-only fixture, not a product page or a task editor. */
export function FoundationPreview() {
  const { theme, setTheme } = useTheme()
  return (
    <main className="mx-auto grid max-w-2xl gap-4 p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-page-title font-semibold">Histask · Foundation</h1>
        <div className="flex gap-2" aria-label="Preview theme">
          {(['system', 'light', 'dark'] as const).map((value) => (
            <Button
              key={value}
              variant={theme === value ? 'default' : 'outline'}
              aria-pressed={theme === value}
              onClick={() => setTheme(value)}
            >
              {value}
            </Button>
          ))}
        </div>
      </header>
      <p className="text-metadata text-muted-foreground">
        개발 검증 전용 · 입력 내용은 저장되지 않습니다.
      </p>
      <section
        className="grid gap-3 rounded-card border bg-surface p-4"
        aria-label="Typography"
      >
        <h2 className="text-card-title font-semibold">
          업무 제목과 최근 진행 내용의 가독성 확인
        </h2>
        <p>
          SQL 조건 수정 및 로컬 테스트 완료. 긴 한국어와 English text가 함께
          있어도 읽을 수 있어야 합니다.
        </p>
        <p className="text-metadata text-muted-foreground">
          Metadata · 12px · 조용하고 읽기 쉬운 보조 정보
        </p>
      </section>
      <section className="grid gap-3" aria-label="Controls">
        <div className="grid gap-2">
          <Label htmlFor="sample-input">기본 입력</Label>
          <Input id="sample-input" placeholder="내용 입력" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="invalid-input">입력 오류</Label>
          <Input
            id="invalid-input"
            aria-invalid="true"
            aria-describedby="input-error"
          />
          <p id="input-error" className="text-metadata text-destructive">
            필수 내용을 입력하세요.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="disabled-input">비활성 입력</Label>
          <Input id="disabled-input" disabled placeholder="사용할 수 없음" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sample-text">여러 줄 입력</Label>
          <Textarea
            id="sample-text"
            placeholder="첫 번째 줄&#10;두 번째 줄"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sample-select">선택</Label>
          <Select defaultValue="one">
            <SelectTrigger id="sample-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one">선택 하나</SelectItem>
              <SelectItem value="two">선택 둘</SelectItem>
              <SelectItem value="three" disabled>
                선택 불가
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button>기본 버튼</Button>
          <Button variant="outline">보조 버튼</Button>
          <Button disabled>비활성 버튼</Button>
          <Button variant="destructive">삭제 스타일</Button>
        </div>
      </section>
      <section className="flex flex-wrap gap-2" aria-label="Overlays">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Dialog 확인</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>공통 Dialog</DialogTitle>
              <DialogDescription>
                Esc로 닫으면 실행 버튼으로 초점이 돌아갑니다.
              </DialogDescription>
            </DialogHeader>
            <Label htmlFor="dialog-input">Dialog 입력</Label>
            <Input id="dialog-input" />
          </DialogContent>
        </Dialog>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Sheet 확인</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle className="pr-8 text-page-title font-semibold">
              공통 Sheet
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              이 화면은 카드 상세 기능이 아닌 공통 컨트롤 검증입니다.
            </SheetDescription>
            <Label htmlFor="sheet-input">Sheet 입력</Label>
            <Input id="sheet-input" />
          </SheetContent>
        </Sheet>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Popover 확인</Button>
          </PopoverTrigger>
          <PopoverContent>
            <Label htmlFor="popover-input">Popover 입력</Label>
            <Input id="popover-input" />
          </PopoverContent>
        </Popover>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Tooltip 확인</Button>
            </TooltipTrigger>
            <TooltipContent>
              긴 텍스트를 마우스 hover와 키보드 focus로 읽을 수 있습니다.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </section>
    </main>
  )
}
