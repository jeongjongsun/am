import Swal from 'sweetalert2';

/** 로그인 등 공통 에러 알림 (SweetAlert2). */
export async function showError(title: string, text: string): Promise<void> {
  await Swal.fire({
    icon: 'error',
    title,
    text,
  });
}
