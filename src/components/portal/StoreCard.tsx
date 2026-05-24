import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface StoreCardProps {
  title: string;
  description: string;
  href: string;
  Icon: LucideIcon;
  colorClass: string;
}

export function StoreCard({ title, description, href, Icon, colorClass }: StoreCardProps) {
  return (
    <Link 
      href={href}
      aria-label={`Acessar ${title}`}
      className={`${colorClass} text-white p-8 rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl flex flex-col items-center text-center group`}
    >
      <Icon size={52} className="mb-4 opacity-90 transition-transform duration-300 group-hover:scale-110" />
      <h2 className="text-2xl font-bold mb-2 tracking-wide">{title}</h2>
      <p className="text-white/90 font-medium">{description}</p>
    </Link>
  );
}