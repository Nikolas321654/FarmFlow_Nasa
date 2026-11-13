import logoUrl from '../../../assets/logos/logo_horizontal.svg?url';

export function BrandLogo() {
  return (
    <span className="relative block h-10 w-28 overflow-hidden md:h-16 md:w-48">
      <img
        src={logoUrl}
        alt="Rivnova"
        className="absolute inset-x-0 top-0 w-full max-w-none -translate-y-[32%]"
      />
    </span>
  );
}
