---
read_when:
    - Planejando uma ampla rodada de modernização do aplicativo OpenClaw
    - Atualização dos padrões de implementação de frontend para trabalhos no aplicativo ou na Control UI
    - Transformando uma ampla revisão de qualidade do produto em trabalho de engenharia em fases
summary: Plano abrangente de modernização de aplicações com atualizações da habilidade de entrega de frontend
title: Plano de modernização de aplicações
x-i18n:
    generated_at: "2026-05-06T09:12:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c97bd9c76492b9e7beb0a2623f583a54b5461bebb848fa3ac7e4495322f6456
    source_path: reference/application-modernization-plan.md
    workflow: 16
---

## Objetivo

Mover a aplicação rumo a um produto mais limpo, rápido e sustentável, sem
quebrar fluxos de trabalho atuais nem ocultar riscos em refatorações amplas. O
trabalho deve ser entregue em fatias pequenas e revisáveis, com comprovação para
cada superfície alterada.

## Princípios

- Preserve a arquitetura atual, a menos que um limite esteja comprovadamente
  causando retrabalho, custo de desempenho ou bugs visíveis ao usuário.
- Prefira o menor patch correto para cada problema, depois repita.
- Separe correções obrigatórias de polimentos opcionais para que mantenedores
  possam entregar trabalho de alto valor sem esperar por decisões subjetivas.
- Mantenha o comportamento voltado a Plugin documentado e compatível com versões
  anteriores.
- Verifique o comportamento publicado, os contratos de dependência e os testes
  antes de afirmar que uma regressão foi corrigida.
- Melhore primeiro o caminho principal do usuário: onboarding, autenticação,
  chat, configuração de provedor, gerenciamento de Plugin e diagnósticos.

## Fase 1: Auditoria de linha de base

Faça um inventário da aplicação atual antes de alterá-la.

- Identifique os principais fluxos de trabalho do usuário e as superfícies de
  código responsáveis por eles.
- Liste recursos mortos, configurações duplicadas, estados de erro pouco claros
  e caminhos de renderização caros.
- Capture os comandos de validação atuais para cada superfície.
- Marque problemas como obrigatórios, recomendados ou opcionais.
- Documente bloqueadores conhecidos que precisam de revisão de proprietário,
  especialmente mudanças de API, segurança, release e contrato de Plugin.

Definição de concluído:

- Uma lista de problemas com referências de arquivo relativas à raiz do repo.
- Cada problema tem severidade, superfície proprietária, impacto esperado ao
  usuário e um caminho de validação proposto.
- Nenhum item especulativo de limpeza é misturado às correções obrigatórias.

## Fase 2: Limpeza de produto e UX

Priorize fluxos de trabalho visíveis e remova confusão.

- Ajuste o texto de onboarding e estados vazios em torno de autenticação de
  modelo, status do Gateway e configuração de Plugin.
- Remova ou desabilite recursos mortos quando nenhuma ação for possível.
- Mantenha ações importantes visíveis em larguras responsivas, em vez de
  escondê-las atrás de suposições frágeis de layout.
- Consolide linguagem de status repetida para que erros tenham uma única fonte
  de verdade.
- Adicione divulgação progressiva para configurações avançadas, mantendo a
  configuração principal rápida.

Validação recomendada:

- Caminho feliz manual para configuração de primeira execução e inicialização de
  usuário existente.
- Testes focados para qualquer lógica de roteamento, persistência de configuração
  ou derivação de status.
- Capturas de tela do navegador para superfícies responsivas alteradas.

## Fase 3: Ajuste da arquitetura de frontend

Melhore a sustentabilidade sem uma reescrita ampla.

- Mova transformações repetidas de estado de UI para helpers tipados e estreitos.
- Mantenha separadas as responsabilidades de busca de dados, persistência e
  apresentação.
- Prefira hooks, stores e padrões de componentes existentes a novas abstrações.
- Divida componentes grandes demais apenas quando isso reduzir acoplamento ou
  esclarecer testes.
- Evite introduzir estado global amplo para interações locais de painel.

Proteções obrigatórias:

- Não altere comportamento público como efeito colateral de divisão de arquivos.
- Mantenha intacto o comportamento de acessibilidade para menus, diálogos, abas e
  navegação por teclado.
- Verifique se estados de carregamento, vazio, erro e otimistas ainda
  renderizam.

## Fase 4: Desempenho e confiabilidade

Ataque dores medidas em vez de otimização teórica ampla.

- Meça custos de inicialização, transição de rota, listas grandes e transcrições
  de chat.
- Substitua dados derivados caros e repetidos por seletores memoizados ou helpers
  em cache quando o profiling comprovar valor.
- Reduza varreduras evitáveis de rede ou sistema de arquivos em caminhos quentes.
- Mantenha ordenação determinística para entradas de prompt, registro, arquivo,
  Plugin e rede antes da construção do payload do modelo.
- Adicione testes leves de regressão para helpers quentes e limites de contrato.

Definição de concluído:

- Cada mudança de desempenho registra linha de base, impacto esperado, impacto
  real e lacuna restante.
- Nenhum patch de desempenho é entregue somente por intuição quando medição
  barata está disponível.

## Fase 5: Endurecimento de tipos, contratos e testes

Eleve a correção nos pontos de limite dos quais usuários e autores de Plugin
dependem.

- Substitua strings soltas em runtime por uniões discriminadas ou listas fechadas
  de códigos.
- Valide entradas externas com helpers de schema existentes ou zod.
- Adicione testes de contrato em torno de manifestos de Plugin, catálogos de
  provedores, mensagens de protocolo do Gateway e comportamento de migração de
  configuração.
- Mantenha caminhos de compatibilidade em fluxos de doctor ou reparo, em vez de
  migrações ocultas em tempo de inicialização.
- Evite acoplamento apenas de teste a detalhes internos de Plugin; use fachadas
  do SDK e barrels documentados.

Validação recomendada:

- `pnpm check:changed`
- Testes direcionados para cada limite alterado.
- `pnpm build` quando limites lazy, empacotamento ou superfícies publicadas
  mudarem.

## Fase 6: Documentação e prontidão para release

Mantenha a documentação voltada ao usuário alinhada ao comportamento.

- Atualize a documentação com mudanças de comportamento, API, configuração,
  onboarding ou Plugin.
- Adicione entradas de changelog somente para mudanças visíveis ao usuário.
- Mantenha a terminologia de Plugin voltada ao usuário; use nomes internos de
  pacote somente quando necessário para contribuidores.
- Confirme que as instruções de release e instalação ainda correspondem à
  superfície atual de comandos.

Definição de concluído:

- Documentação relevante é atualizada na mesma branch das mudanças de
  comportamento.
- Verificações de documentação gerada ou drift de API passam quando tocadas.
- O handoff nomeia qualquer validação ignorada e por que ela foi ignorada.

## Primeira fatia recomendada

Comece com uma passagem escopada pela Control UI e pelo onboarding:

- Audite superfícies de configuração de primeira execução, prontidão de
  autenticação de provedor, status do Gateway e configuração de Plugin.
- Remova ações mortas e esclareça estados de falha.
- Adicione ou atualize testes focados para derivação de status e persistência de
  configuração.
- Execute `pnpm check:changed`.

Isso entrega alto valor ao usuário com risco limitado de arquitetura.

## Atualização da skill de frontend

Use esta seção para atualizar o `SKILL.md` focado em frontend fornecido com a
tarefa de modernização. Se estiver adotando esta orientação como uma skill local
do repo para OpenClaw, crie `.agents/skills/openclaw-frontend/SKILL.md`
primeiro, mantenha o frontmatter que pertence a essa skill de destino e então
adicione ou substitua a orientação do corpo pelo conteúdo a seguir.

```markdown
# Frontend Delivery Standards

Use this skill when implementing or reviewing user-facing React, Next.js,
desktop webview, or app UI work.

## Operating rules

- Start from the existing product workflow and code conventions.
- Prefer the smallest correct patch that improves the current user path.
- Separate required fixes from optional polish in the handoff.
- Do not build marketing pages when the request is for an application surface.
- Keep actions visible and usable across supported viewport sizes.
- Remove dead affordances instead of leaving controls that cannot act.
- Preserve loading, empty, error, success, and permission states.
- Use existing design-system components, hooks, stores, and icons before adding
  new primitives.

## Implementation checklist

1. Identify the primary user task and the component or route that owns it.
2. Read the local component patterns before editing.
3. Patch the narrowest surface that solves the issue.
4. Add responsive constraints for fixed-format controls, toolbars, grids, and
   counters so text and hover states cannot resize the layout unexpectedly.
5. Keep data loading, state derivation, and rendering responsibilities clear.
6. Add tests when logic, persistence, routing, permissions, or shared helpers
   change.
7. Verify the main happy path and the most relevant edge case.

## Visual quality gates

- Text must fit inside its container on mobile and desktop.
- Toolbars may wrap, but controls must remain reachable.
- Buttons should use familiar icons when the icon is clearer than text.
- Cards should be used for repeated items, modals, and framed tools, not for
  every page section.
- Avoid one-note color palettes and decorative backgrounds that compete with
  operational content.
- Dense product surfaces should optimize for scanning, comparison, and repeated
  use.

## Handoff format

Report:

- What changed.
- What user behavior changed.
- Required validation that passed.
- Any validation skipped and the concrete reason.
- Optional follow-up work, clearly separated from required fixes.
```
