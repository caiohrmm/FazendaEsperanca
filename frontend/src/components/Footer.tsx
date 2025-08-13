export default function Footer(){
  return (
    <footer className="mt-12 border-t bg-white">
      <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/obra-inicio.png" alt="Obra" className="h-10 w-auto rounded" />
          <div>
            <div className="font-semibold">Fazenda Esperança São Domingos Gusmão</div>
            <div className="text-sm text-gray-600">Sistema de gestão de recibos e saídas médicas desenvolvido por Caio Henrique Rodrigues Martins</div>
          </div>
        </div>
        <div className="text-sm text-gray-600">© {new Date().getFullYear()} Fazenda Esperança. Todos os direitos reservados.</div>
      </div>
    </footer>
  )
}


