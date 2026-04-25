---
read_when:
    - Planejando uma ampla modernização de aplicações do OpenClaw
    - Atualizando os padrões de implementação de frontend para trabalho em apps ou na Control UI
    - Transformando uma ampla revisão de qualidade do produto em trabalho de engenharia em fases
summary: Plano abrangente de modernização de aplicações com atualizações das Skills de entrega de frontend
title: Plano de modernização de aplicações
x-i18n:
    generated_at: "2026-04-25T13:55:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 667a133cb867bb1d4d09e097925704c8b77d20ca6117a62a4c60d29ab1097283
    source_path: reference/application-modernization-plan.md
    workflow: 15
---

# Plano de modernização de aplicações

## Objetivo

Levar a aplicação para um produto mais limpo, rápido e fácil de manter, sem
quebrar os fluxos de trabalho atuais nem ocultar riscos em refatorações amplas. O trabalho deve
ser entregue em partes pequenas e revisáveis, com evidências para cada superfície afetada.

## Princípios

- Preserve a arquitetura atual, a menos que um limite esteja comprovadamente causando retrabalho,
  custo de desempenho ou bugs visíveis para o usuário.
- Prefira a menor correção correta para cada problema e, depois, repita.
- Separe correções obrigatórias de refinamentos opcionais para que os mantenedores possam entregar
  trabalho de alto valor sem esperar por decisões subjetivas.
- Mantenha o comportamento voltado para Plugin documentado e retrocompatível.
- Verifique o comportamento entregue, os contratos das dependências e os testes antes de afirmar que uma
  regressão foi corrigida.
- Melhore primeiro o principal caminho do usuário: onboarding, autenticação, chat, configuração de provedor,
  gerenciamento de Plugins e diagnósticos.

## Fase 1: Auditoria de linha de base

Inventarie a aplicação atual antes de fazer alterações.

- Identifique os principais fluxos de trabalho do usuário e as superfícies de código responsáveis por eles.
- Liste affordances inativas, configurações duplicadas, estados de erro pouco claros e caminhos de renderização caros.
- Registre os comandos de validação atuais para cada superfície.
- Marque os problemas como obrigatórios, recomendados ou opcionais.
- Documente bloqueadores conhecidos que precisam de revisão do owner, especialmente alterações de API, segurança,
  release e contrato de Plugin.

Definição de concluído:

- Uma lista única de problemas com referências de arquivos a partir da raiz do repositório.
- Cada problema tem severidade, superfície owner, impacto esperado para o usuário e um caminho de validação proposto.
- Nenhum item especulativo de limpeza está misturado com correções obrigatórias.

## Fase 2: Limpeza de produto e UX

Priorize fluxos visíveis e remova confusão.

- Ajuste o texto de onboarding e os estados vazios em torno de autenticação de modelo, status do Gateway
  e configuração de Plugin.
- Remova ou desative affordances inativas quando nenhuma ação for possível.
- Mantenha ações importantes visíveis em larguras responsivas, em vez de escondê-las
  por trás de suposições frágeis de layout.
- Consolide linguagem de status repetida para que os erros tenham uma única fonte de verdade.
- Adicione divulgação progressiva para configurações avançadas, mantendo a configuração principal rápida.

Validação recomendada:

- Caminho feliz manual para configuração na primeira execução e inicialização de usuários existentes.
- Testes focados para qualquer lógica de roteamento, persistência de configuração ou derivação de status.
- Capturas de tela no navegador para superfícies responsivas alteradas.

## Fase 3: Ajuste da arquitetura de frontend

Melhore a manutenibilidade sem uma reescrita ampla.

- Mova transformações repetidas de estado de UI para helpers tipados e específicos.
- Mantenha separadas as responsabilidades de busca de dados, persistência e apresentação.
- Prefira hooks, stores e padrões de componentes existentes em vez de novas abstrações.
- Divida componentes grandes apenas quando isso reduzir acoplamento ou tornar os testes mais claros.
- Evite introduzir estado global amplo para interações locais de painéis.

Proteções obrigatórias:

- Não altere o comportamento público como efeito colateral da divisão de arquivos.
- Mantenha intacto o comportamento de acessibilidade para menus, diálogos, abas e navegação por teclado.
- Verifique se os estados de carregamento, vazio, erro e otimista ainda são renderizados.

## Fase 4: Desempenho e confiabilidade

Ataque dores medidas, e não otimizações teóricas amplas.

- Meça os custos de inicialização, transição de rotas, listas grandes e transcrição de chat.
- Substitua dados derivados caros e repetidos por seletores memoizados ou helpers com cache
  quando a análise de desempenho comprovar valor.
- Reduza varreduras evitáveis de rede ou sistema de arquivos em caminhos críticos.
- Mantenha ordenação determinística para entradas de prompt, registro, arquivo, Plugin e rede
  antes da construção do payload do modelo.
- Adicione testes leves de regressão para helpers quentes e limites de contrato.

Definição de concluído:

- Cada alteração de desempenho registra linha de base, impacto esperado, impacto real e
  lacuna restante.
- Nenhuma correção de desempenho é entregue apenas por intuição quando há medição barata disponível.

## Fase 5: Fortalecimento de tipos, contratos e testes

Aumente a correção nos pontos de limite dos quais usuários e autores de Plugin dependem.

- Substitua strings soltas em tempo de execução por uniões discriminadas ou listas fechadas de códigos.
- Valide entradas externas com helpers de schema existentes ou zod.
- Adicione testes de contrato em torno de manifestos de Plugin, catálogos de provedores, mensagens do protocolo do Gateway
  e comportamento de migração de configuração.
- Mantenha caminhos de compatibilidade em fluxos de doctor ou repair, em vez de migrações ocultas
  no tempo de inicialização.
- Evite acoplamento em testes apenas com internals de Plugin; use fachadas de SDK e barrels documentados.

Validação recomendada:

- `pnpm check:changed`
- Testes direcionados para cada limite alterado.
- `pnpm build` quando limites lazy, empacotamento ou superfícies publicadas forem alterados.

## Fase 6: Documentação e prontidão para release

Mantenha a documentação voltada ao usuário alinhada ao comportamento.

- Atualize a documentação com alterações de comportamento, API, configuração, onboarding ou Plugin.
- Adicione entradas no changelog apenas para alterações visíveis para o usuário.
- Mantenha a terminologia de Plugin voltada ao usuário; use nomes internos de pacote apenas onde
  for necessário para contribuidores.
- Confirme que as instruções de release e instalação ainda correspondem à superfície atual de comandos.

Definição de concluído:

- A documentação relevante é atualizada na mesma branch das alterações de comportamento.
- Verificações de deriva de docs ou API geradas passam quando forem afetadas.
- A entrega nomeia qualquer validação ignorada e por que ela foi ignorada.

## Primeira parte recomendada

Comece com uma passagem focada em Control UI e onboarding:

- Audite as superfícies de configuração na primeira execução, prontidão de autenticação do provedor, status do Gateway e
  configuração de Plugin.
- Remova ações inativas e esclareça estados de falha.
- Adicione ou atualize testes focados para derivação de status e persistência de configuração.
- Execute `pnpm check:changed`.

Isso oferece alto valor para o usuário com risco arquitetural limitado.

## Atualização da skill de frontend

Use esta seção para atualizar o `SKILL.md` focado em frontend fornecido com a tarefa de
modernização. Se adotar esta orientação como uma skill local do repositório para OpenClaw,
crie primeiro `.agents/skills/openclaw-frontend/SKILL.md`, mantenha o frontmatter
que pertence a essa skill de destino e, em seguida, adicione ou substitua o conteúdo do body pela
seguinte seção.

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
