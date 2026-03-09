const ComingSoon = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh]">
    <h1 className="text-2xl font-heading font-bold mb-2">{title}</h1>
    <p className="text-muted-foreground">Em breve! Esta funcionalidade está sendo desenvolvida.</p>
  </div>
);

export default ComingSoon;
