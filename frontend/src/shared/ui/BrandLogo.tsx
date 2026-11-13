import logoUrl from '../../../assets/logos/logo_horizontal.svg?url';

export function BrandLogo() {
  return (
    <span className="relative block h-12 w-40 overflow-hidden sm:h-16 sm:w-56">
      <img
        src={logoUrl}
        alt="Rivnova"
        className="absolute inset-x-0 top-0 w-full max-w-none -translate-y-[32%]"
      />
    </span>
  );
}
