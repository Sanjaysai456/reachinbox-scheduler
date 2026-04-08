type StateBlockProps = {
  title: string;
  description: string;
};

export const StateBlock = ({ title, description }: StateBlockProps) => (
  <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
    <div className="mx-auto flex max-w-md flex-col items-center gap-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
        <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path
            d="M6.75 8.75h10.5M6.75 12h10.5m-10.5 3.25h6.5M7 19h10c1.105 0 2-.895 2-2V7c0-1.105-.895-2-2-2H7c-1.105 0-2 .895-2 2v10c0 1.105.895 2 2 2Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm leading-6 text-gray-500">{description}</p>
    </div>
  </div>
);
