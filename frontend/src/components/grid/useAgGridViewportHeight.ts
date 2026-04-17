import { useEffect, useState } from 'react';

/** 레이아웃 뷰포트 하단(스크롤바 제외)과 비주얼 뷰포트 중 더 작은 값 — 과대 계산 방지 */
function layoutViewportBottom(): number {
  const vv = window.visualViewport;
  const visual = vv != null ? vv.offsetTop + vv.height : window.innerHeight;
  const layout = document.documentElement.clientHeight;
  return Math.min(visual, layout);
}

/**
 * 그리드 ~ `.content` 하단까지 조상에 쌓인 padding-bottom 합.
 * Phoenix `.content`의 큰 padding-bottom(푸터 여백) 등이 페이지 세로 스크롤을 만드는 것을 막기 위함.
 */
function ancestorPaddingBottomBelow(el: HTMLElement): number {
  let sum = 0;
  let node: HTMLElement | null = el.parentElement;
  while (node != null && node !== document.body) {
    const pb = parseFloat(getComputedStyle(node).paddingBottom);
    if (Number.isFinite(pb)) sum += pb;
    if (node.classList.contains('content')) break;
    node = node.parentElement;
  }
  return sum;
}

/**
 * 요소 상단 ~ 가시 뷰포트 하단까지 높이 (리사이즈·VisualViewport·부모 레이아웃 변화 반영).
 */
export function useAgGridViewportHeight(
  containerRef: React.RefObject<HTMLDivElement | null>,
  bottomOffset = 16,
) {
  const [height, setHeight] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const top = el.getBoundingClientRect().top;
      const reserve = bottomOffset + ancestorPaddingBottomBelow(el);
      const h = layoutViewportBottom() - top - reserve;
      setHeight(Math.max(200, Math.floor(h)));
    };

    update();
    window.addEventListener('resize', update);

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    }

    const ro = new ResizeObserver(update);
    ro.observe(el.parentElement ?? document.body);

    return () => {
      window.removeEventListener('resize', update);
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      }
      ro.disconnect();
    };
  }, [containerRef, bottomOffset]);

  return height;
}
