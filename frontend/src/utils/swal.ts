import Swal from 'sweetalert2';

/**
 * SweetAlert2에 넣을 문자열: `<br>`(또는 잔여 `\n`)으로 줄 나눈 뒤 구간마다 HTML 이스케이프하고 `<br>`로 다시 이어 붙인다.
 * 서버/프로퍼티의 `<br>` 표기와 구형 `\n` 모두 지원한다.
 */
function toSafeSwalHtml(input: string): string {
  const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const parts = normalized.split(/(?:<br\s*\/?>|\n)/i);
  return parts
    .map((segment) =>
      segment
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;'),
    )
    .join('<br>');
}

const errorAlert = Swal.mixin({
  icon: 'error',
  title: false,
  showConfirmButton: true,
  confirmButtonText: 'OK',
  allowOutsideClick: false,
  focusConfirm: true,
  didOpen: () => {
    queueMicrotask(() => {
      Swal.getConfirmButton()?.focus();
    });
  },
});

/** 로그인 등 공통 에러 알림 (SweetAlert2). `title` 인자는 하위 호환용으로 받지만 표시하지 않는다. */
export async function showError(_title: string, text: string): Promise<void> {
  await errorAlert.fire({
    html: toSafeSwalHtml(text),
  });
}
