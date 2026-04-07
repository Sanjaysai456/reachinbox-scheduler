type StateBlockProps = {
  title: string;
  description: string;
};

export const StateBlock = ({ title, description }: StateBlockProps) => (
  <div className="state-block">
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);
