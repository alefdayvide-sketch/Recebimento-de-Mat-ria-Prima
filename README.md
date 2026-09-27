# Icopallet · Recebimento de Matéria-Prima

Sistema de Gestão de Romaneios, Fichas Cegas, Qualidade Industrial e Aprovação Executiva para o recebimento de madeira.

SPA em **React 18 + TypeScript + Tailwind CSS**, com ícones **Lucide React** e gráficos **Recharts**. Visual claro "Fluxo Visual": fundo branco, cargas em colunas por etapa, ilustrações vetoriais de caminhão, container e fardos (`src/components/Art.tsx`) e cores por etapa: verde-água (pátio), carmim (qualidade), âmbar (decisão) e verde (estoque), com o bordô `#8b1a1a` da marca. Fontes: Sora, DM Sans e DM Mono.

## Como rodar

Requer Node.js 18 ou superior.

```bash
npm install
npm run dev      # abre em http://localhost:5173
npm run build    # gera a versão de produção em dist/
```

Para publicar online de graça, importe este repositório na [Vercel](https://vercel.com) ou [Netlify](https://netlify.com): o framework (Vite) é detectado automaticamente.

## Fluxo entre os 3 departamentos

```
ADMIN emite romaneio ──► Ficha Cega "Aguardando Caminhão" (Logística)
                                     │
                      Finalizar Conferência e Enviar Ficha Cega
                                     │
            ┌────────── algum fardo ≥ 20%? ──────────┐
            │ sim                                     │ não
            ▼                                         ▼
   "Ag. Qualidade" (perícia + laudo) ──────► "Ag. Aprovação Admin"
                                                      │
                     Aprovar ► Finalizado · Devolver ► Logística ou Qualidade
```

| Perfil | Telas |
|---|---|
| Administrador | Dashboard, Análise Admin, Romaneios, Logística, Qualidade, Comparativo, Indicadores, Consulta |
| Logística | Fichas Cegas & Pátio, Consulta & Histórico |
| Qualidade | Inspeção Qualidade (≥20%), Comparativo Auditado, Consulta & Histórico |

O perfil é trocado pelos botões no topo da barra lateral.

## Regras de cálculo

Implementadas em [`src/lib/calc.ts`](src/lib/calc.ts):

- **m³** = espessura × largura × comprimento (mm) × peças ÷ 1.000.000.000
- **% peças** de um fardo = peças divergentes ÷ amostra coletada
- **% m³** de um fardo: as peças divergentes recebem as variações medidas (Δ espessura, Δ largura, Δ comprimento); a proporção de divergentes da amostra é extrapolada para o fardo inteiro, gerando o m³ real. % m³ = |m³ real − m³ nominal| ÷ m³ nominal
- **Severidade** = maior entre % peças e % m³
- **Roteamento**: se qualquer fardo tiver severidade ≥ 20% a carga vai para a Qualidade; senão, direto para o Admin
- **m³ corrigido** do item = soma do m³ real dos seus fardos

O teto de 20% está na constante `LIMITE_SEVERIDADE`.

## Estrutura

```
src/
  types.ts                 Interfaces (Romaneio, RomaneioItem, FardoRecebido…)
  lib/calc.ts              m³, divergência, roteamento, comparativos, KPIs
  lib/store.ts             Estado + persistência em localStorage (icopallet_data_v4)
  lib/mock.ts              Dados de exemplo (5 cenários)
  lib/format.ts            Formatação pt-BR e cópia para área de transferência
  components/              Layout (Sidebar, Header), UI base e tabela comparativa
  modules/                 Uma tela por módulo
```

## Dados

Os dados ficam no `localStorage` do navegador (chave `icopallet_data_v4`). Na primeira execução o sistema carrega 5 cargas de exemplo: aguardando caminhão, retida na Qualidade (25% de divergência e +2 mm na espessura), no Admin direto da Logística (8%), no Admin com laudo técnico, e finalizada. O botão **Restaurar dados de demonstração**, no rodapé da barra lateral, volta a esse estado.

Por usar `localStorage`, cada navegador tem seus próprios dados. Para uso real com várias pessoas ao mesmo tempo, o próximo passo é ligar o `store.ts` a um banco de dados (por exemplo Supabase ou Firebase).
