type MenuContentPageProps = {
  title: string;
};

export function MenuContentPage({ title }: MenuContentPageProps) {
  return (
    <div className="py-3">
      <h1 className="h4 mb-2">{title}</h1>
      <p className="text-body-secondary mb-0">화면 콘텐츠는 추후 구현 예정입니다.</p>
    </div>
  );
}
