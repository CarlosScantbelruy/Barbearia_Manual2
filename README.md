# Frontend — Manual Barbearia (React + Vite + Tailwind)

## Como usar
1. Entre na pasta `frontend`
2. `npm install`
3. `npm run dev` — roda em `http://localhost:5173` por padrão (Vite)

O frontend já está configurado com os serviços e barbeiro solicitados:
- Corte e Barba — R$ 30,00
- Limpeza de Pele — R$ 10,00
- Barbeiro: Carlos

Para conectar com o backend, rode o backend (porta 5000) e certifique-se de que as chamadas fetch (no código) usem a URL correta. Se for implantar juntos, configure proxy ou variável VITE_API_BASE.
