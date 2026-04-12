---
read_when:
    - Executando testes localmente ou no CI
    - Adicionando regressões para bugs de modelo/provedor
    - Depurando o comportamento do Gateway + agente
summary: 'Kit de testes: suítes unit/e2e/live, runners Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-12T23:28:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a66ea672c386094ab4a8035a082c8a85d508a14301ad44b628d2a10d9cec3a52
    source_path: help/testing.md
    workflow: 15
---

# Testes

O OpenClaw tem três suítes Vitest (unit/integration, e2e, live) e um pequeno conjunto de runners Docker.

Este documento é um guia de “como testamos”:

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre)
- Quais comandos executar para fluxos comuns (local, pré-push, depuração)
- Como os testes live descobrem credenciais e selecionam modelos/provedores
- Como adicionar regressões para problemas reais de modelo/provedor

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes de fazer push): `pnpm build && pnpm check && pnpm test`
- Execução completa mais rápida da suíte local em uma máquina com bastante recurso: `pnpm test:max`
- Loop direto de watch do Vitest: `pnpm test:watch`
- O direcionamento direto por arquivo agora também encaminha caminhos de extensões/canais: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira primeiro execuções direcionadas quando estiver iterando em uma única falha.
- Site de QA com suporte de Docker: `pnpm qa:lab:up`
- Lane de QA com suporte de VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você mexer nos testes ou quiser mais confiança:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte live (modelos + sondas de ferramenta/imagem do Gateway): `pnpm test:live`
- Direcionar um arquivo live em modo silencioso: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Dica: quando você só precisa de um caso com falha, prefira restringir os testes live com as variáveis de ambiente de allowlist descritas abaixo.

## Runners específicos de QA

Esses comandos ficam ao lado das suítes principais de teste quando você precisa do realismo do QA-lab:

- `pnpm openclaw qa suite`
  - Executa cenários de QA com suporte do repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers isolados do Gateway, até 64 workers ou a contagem de cenários selecionados. Use `--concurrency <count>` para ajustar a quantidade de workers, ou `--concurrency 1` para a lane serial mais antiga.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux Multipass descartável.
  - Mantém o mesmo comportamento de seleção de cenários que `qa suite` no host.
  - Reutiliza os mesmos flags de seleção de provedor/modelo que `qa suite`.
  - Execuções live encaminham as entradas de autenticação de QA compatíveis que são práticas para a guest:
    chaves de provedor baseadas em env, o caminho de configuração do provedor live de QA e `CODEX_HOME`, quando presente.
  - Os diretórios de saída precisam permanecer sob a raiz do repositório para que a guest possa gravar de volta por meio do workspace montado.
  - Grava o relatório + resumo normais de QA, além dos logs do Multipass, em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA com suporte de Docker para trabalho de QA no estilo operador.
- `pnpm openclaw qa matrix`
  - Executa a lane live de QA do Matrix contra um homeserver Tuwunel descartável com suporte de Docker.
  - Provisiona três usuários Matrix temporários (`driver`, `sut`, `observer`) mais uma sala privada, depois inicia um processo filho do Gateway de QA com o plugin Matrix real como transporte do SUT.
  - Usa por padrão a imagem estável fixa do Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Substitua com `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando precisar testar uma imagem diferente.
  - Grava um relatório, resumo e artefato de eventos observados do Matrix QA em `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Executa a lane live de QA do Telegram contra um grupo privado real usando os tokens de bot do driver e do SUT vindos do env.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O ID do grupo deve ser o ID numérico do chat do Telegram.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para uma observação estável de bot para bot, habilite o Modo de Comunicação Bot-to-Bot em `@BotFather` para ambos os bots e garanta que o bot driver consiga observar o tráfego de bots no grupo.
  - Grava um relatório, resumo e artefato de mensagens observadas do Telegram QA em `.artifacts/qa-e2e/...`.

As lanes de transporte live compartilham um contrato padrão para que novos transportes não saiam do padrão:

`qa-channel` continua sendo a suíte ampla de QA sintética e não faz parte da matriz de cobertura de transporte live.

| Lane     | Canary | Gate de menção | Bloco de allowlist | Resposta de nível superior | Retomada após reinício | Follow-up em thread | Isolamento de thread | Observação de reação | Comando de ajuda |
| -------- | ------ | -------------- | ------------------ | -------------------------- | ---------------------- | ------------------- | -------------------- | ------------------- | ---------------- |
| Matrix   | x      | x              | x                  | x                          | x                      | x                   | x                    | x                   |                  |
| Telegram | x      |                |                    |                            |                        |                     |                      |                     | x                |

### Adicionando um canal ao QA

Adicionar um canal ao sistema de QA em Markdown exige exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercite o contrato do canal.

Não adicione um runner de QA específico do canal quando o runner compartilhado `qa-lab` puder ser dono do fluxo.

`qa-lab` é dono da mecânica compartilhada:

- inicialização e encerramento da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários antigos de `qa-channel`

O adaptador de canal é dono do contrato de transporte:

- como o Gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcrições e estado normalizado do transporte são expostos
- como ações com suporte do transporte são executadas
- como reset ou limpeza específicos do transporte são tratados

O nível mínimo de adoção para um novo canal é:

1. Implementar o adaptador de transporte na interface compartilhada do `qa-lab`.
2. Registrar o adaptador no registro de transportes.
3. Manter a mecânica específica do transporte dentro do adaptador ou do harness do canal.
4. Criar ou adaptar cenários Markdown em `qa/scenarios/`.
5. Usar os helpers genéricos de cenários para novos cenários.
6. Manter os aliases de compatibilidade existentes funcionando, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é estrita:

- Se o comportamento puder ser expresso uma vez no `qa-lab`, coloque-o no `qa-lab`.
- Se o comportamento depender de um transporte de canal, mantenha-o nesse adaptador ou harness de plugin.
- Se um cenário precisar de uma nova capacidade que mais de um canal possa usar, adicione um helper genérico em vez de um branch específico de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico daquele transporte e deixe isso explícito no contrato do cenário.

Nomes preferenciais de helpers genéricos para novos cenários:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Aliases de compatibilidade continuam disponíveis para cenários existentes, incluindo:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Novos trabalhos de canal devem usar os nomes genéricos dos helpers.
Os aliases de compatibilidade existem para evitar uma migração de uma vez só, não como modelo para a criação de novos cenários.

## Suítes de teste (o que roda onde)

Pense nas suítes como “realismo crescente” (e custo/instabilidade crescentes):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Configuração: dez execuções sequenciais em shards (`vitest.full-*.config.ts`) sobre os projetos Vitest com escopo já existentes
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes Node permitidos de `ui` cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes unitários puros
  - Testes de integração em processo (auth do Gateway, roteamento, ferramentas, parsing, config)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda em CI
  - Não requer chaves reais
  - Deve ser rápido e estável
- Observação sobre projetos:
  - `pnpm test` sem direcionamento agora executa onze configurações menores em shards (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo gigante do projeto raiz nativo. Isso reduz o pico de RSS em máquinas carregadas e evita que o trabalho de auto-reply/extensões deixe outras suítes sem recursos.
  - `pnpm test --watch` ainda usa o grafo de projetos nativo da raiz em `vitest.config.ts`, porque um loop de watch com múltiplos shards não é prático.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` encaminham primeiro alvos explícitos de arquivo/diretório por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo de inicialização do projeto raiz completo.
  - `pnpm test:changed` expande caminhos git alterados nas mesmas lanes com escopo quando o diff toca apenas arquivos de origem/teste roteáveis; edições de config/setup ainda fazem fallback para a nova execução ampla do projeto raiz.
  - Testes unitários leves de importação de agents, commands, plugins, helpers de auto-reply, `plugin-sdk` e áreas utilitárias puras semelhantes passam pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos stateful/pesados de runtime permanecem nas lanes existentes.
  - Alguns arquivos-fonte auxiliares selecionados de `plugin-sdk` e `commands` também mapeiam execuções em modo changed para testes irmãos explícitos nessas lanes leves, para que edições em helpers evitem reexecutar a suíte pesada completa daquele diretório.
  - `auto-reply` agora tem três buckets dedicados: helpers core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. Isso mantém o trabalho mais pesado do harness de reply fora dos testes baratos de status/chunk/token.
- Observação sobre o runner embutido:
  - Quando você alterar entradas de descoberta de ferramentas de mensagem ou o contexto de runtime de compaction,
    mantenha ambos os níveis de cobertura.
  - Adicione regressões focadas de helper para limites puros de roteamento/normalização.
  - Também mantenha saudáveis as suítes de integração do runner embutido:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Essas suítes verificam que IDs com escopo e o comportamento de compaction ainda passam
    pelos caminhos reais `run.ts` / `compact.ts`; testes apenas de helper não são um
    substituto suficiente para esses caminhos de integração.
- Observação sobre pool:
  - A configuração base do Vitest agora usa `threads` por padrão.
  - A configuração compartilhada do Vitest também fixa `isolate: false` e usa o runner não isolado nos projetos da raiz, nas configs e2e e live.
  - A lane UI da raiz mantém sua configuração e otimizador `jsdom`, mas agora também roda no runner compartilhado não isolado.
  - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração compartilhada do Vitest.
  - O launcher compartilhado `scripts/run-vitest.mjs` agora também adiciona `--no-maglev` por padrão para processos Node filhos do Vitest, para reduzir o churn de compilação do V8 durante grandes execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se precisar comparar com o comportamento padrão do V8.
- Observação sobre iteração local rápida:
  - `pnpm test:changed` encaminha por lanes com escopo quando os caminhos alterados mapeiam de forma limpa para uma suíte menor.
  - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento, apenas com um limite maior de workers.
  - O autoescalonamento local de workers agora é intencionalmente conservador e também recua quando a média de carga do host já está alta, para que múltiplas execuções simultâneas do Vitest causem menos impacto por padrão.
  - A configuração base do Vitest marca os projetos/arquivos de configuração como `forceRerunTriggers` para que novas execuções em modo changed permaneçam corretas quando a fiação de testes muda.
  - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser um local de cache explícito para profiling direto.
- Observação sobre depuração de performance:
  - `pnpm test:perf:imports` habilita relatórios de duração de importação do Vitest mais a saída de detalhamento de importação.
  - `pnpm test:perf:imports:changed` limita a mesma visão de profiling aos arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` roteado com o caminho nativo do projeto raiz para esse diff commitado e mostra wall time mais RSS máximo no macOS.
- `pnpm test:perf:changed:bench -- --worktree` faz benchmark da árvore atual com alterações, roteando a lista de arquivos alterados por `scripts/test-projects.mjs` e pela config raiz do Vitest.
  - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para a sobrecarga de inicialização e transformação do Vitest/Vite.
  - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a suíte unit com paralelismo de arquivos desabilitado.

### E2E (smoke do Gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, em linha com o restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Roda em modo silencioso por padrão para reduzir a sobrecarga de E/S do console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reativar saída detalhada do console.
- Escopo:
  - Comportamento end-to-end do Gateway com múltiplas instâncias
  - Superfícies WebSocket/HTTP, pareamento de Node e networking mais pesado
- Expectativas:
  - Roda em CI (quando habilitado no pipeline)
  - Não requer chaves reais
  - Tem mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `test/openshell-sandbox.e2e.test.ts`
- Escopo:
  - Inicia um Gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw sobre `sandbox ssh-config` real + execução SSH
  - Verifica o comportamento canônico remoto do sistema de arquivos por meio da bridge de fs do sandbox
- Expectativas:
  - Somente opt-in; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer uma CLI `openshell` local mais um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados e então destrói o Gateway e o sandbox de teste
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou script wrapper

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Este provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Detectar mudanças de formato do provedor, quirks de chamada de ferramentas, problemas de auth e comportamento de limite de taxa
- Expectativas:
  - Não é estável para CI por definição (redes reais, políticas reais de provedor, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos limitados em vez de “tudo”
- Execuções live carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/auth para um home temporário de teste para que fixtures unit não alterem seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando quiser intencionalmente que os testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do Gateway/ruído do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser restaurar os logs completos de inicialização.
- Rotação de chaves de API (específica por provedor): defina `*_API_KEYS` com formato de vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/heartbeat:
  - As suítes live agora emitem linhas de progresso para stderr para que chamadas longas de provedor mostrem atividade visível mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso de provedor/Gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste heartbeats de Gateway/sonda com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se mudou muita coisa)
- Tocando em networking do Gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provedor / chamada de ferramentas: execute um `pnpm test:live` limitado

## Live: varredura de capacidades do Node Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todo comando atualmente anunciado** por um Node Android conectado e validar o comportamento do contrato de comando.
- Escopo:
  - Pré-configurado/manual (a suíte não instala/executa/pareia o app).
  - Validação `node.invoke` do Gateway comando por comando para o Node Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado + pareado com o Gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capacidades que você espera que passem.
- Substituições opcionais de alvo:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos de configuração do Android: [App Android](/pt-BR/platforms/android)

## Live: smoke de modelo (chaves de perfil)

Os testes live são divididos em duas camadas para que possamos isolar falhas:

- “Modelo direto” nos diz se o provedor/modelo consegue responder com aquela chave.
- “Smoke do Gateway” nos diz se o pipeline completo de Gateway+agente funciona para aquele modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: completion direta do modelo (sem Gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena completion por modelo (e regressões direcionadas quando necessário)
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente executar esta suíte; caso contrário, ela é ignorada para manter `pnpm test:live` focado no smoke do Gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a allowlist moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por vírgulas)
  - As varreduras modern/all usam por padrão um limite selecionado de alto sinal; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfis e fallbacks de env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **apenas armazenamento de perfis**
- Por que isso existe:
  - Separa “a API do provedor está quebrada / a chave é inválida” de “o pipeline do agente Gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: replay de reasoning do OpenAI Responses/Codex Responses + fluxos de chamada de ferramentas)

### Camada 2: smoke do Gateway + agente dev (o que o "@openclaw" realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Subir um Gateway em processo
  - Criar/aplicar patch em uma sessão `agent:dev:*` (substituição de modelo por execução)
  - Iterar pelos modelos com chaves e validar:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (sonda de read)
    - sondas extras opcionais de ferramenta (sonda de exec+read)
    - caminhos de regressão do OpenAI (somente tool-call → follow-up) continuam funcionando
- Detalhes das sondas (para que você possa explicar falhas rapidamente):
  - sonda `read`: o teste grava um arquivo nonce no workspace e pede ao agente para fazer `read` dele e retornar o nonce.
  - sonda `exec+read`: o teste pede ao agente para gravar um nonce em um arquivo temporário com `exec` e depois fazer `read` dele.
  - sonda de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a allowlist moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - As varreduras modern/all do Gateway usam por padrão um limite selecionado de alto sinal; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores (evitar “OpenRouter tudo”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por vírgulas)
- Sondas de ferramenta + imagem estão sempre ativas neste teste live:
  - sonda `read` + sonda `exec+read` (stress de ferramentas)
  - a sonda de imagem roda quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (alto nível):
    - O teste gera um PNG minúsculo com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O Gateway faz parse dos anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente embutido encaminha uma mensagem de usuário multimodal ao modelo
    - Validação: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são permitidos)

Dica: para ver o que você pode testar na sua máquina (e os IDs exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke do backend CLI (Claude, Codex, Gemini ou outras CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline de Gateway + agente usando um backend CLI local, sem tocar na sua config padrão.
- Os padrões de smoke específicos do backend ficam na definição `cli-backend.ts` da extensão proprietária.
- Habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - Comportamento de comando/args/imagem vem dos metadados do plugin proprietário do backend CLI.
- Substituições (opcionais):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (os caminhos são injetados no prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivo de imagem como args da CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como os args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para desabilitar a sonda padrão de continuidade na mesma sessão Claude Sonnet -> Opus (defina como `1` para forçá-la quando o modelo selecionado oferecer suporte a um alvo de troca).

Exemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Receita Docker:

```bash
pnpm test:docker:live-cli-backend
```

Receitas Docker de provedor único:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Observações:

- O runner Docker fica em `scripts/test-live-cli-backend-docker.sh`.
- Ele executa o smoke live do backend CLI dentro da imagem Docker do repositório como o usuário não root `node`.
- Ele resolve metadados do smoke da CLI a partir da extensão proprietária e então instala o pacote Linux CLI correspondente (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) em um prefixo gravável em cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requer OAuth portátil de assinatura do Claude Code por meio de `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` vindo de `claude setup-token`. Primeiro ele prova `claude -p` direto no Docker, depois executa dois turnos do backend CLI do Gateway sem preservar variáveis de env de chave de API da Anthropic. Essa lane de assinatura desabilita por padrão as sondas Claude MCP/tool e de imagem porque o Claude atualmente roteia o uso de apps de terceiros por cobrança de uso extra em vez dos limites normais do plano de assinatura.
- O smoke live do backend CLI agora exercita o mesmo fluxo end-to-end para Claude, Codex e Gemini: turno de texto, turno de classificação de imagem e, em seguida, chamada da ferramenta MCP `cron` validada pelo Gateway CLI.
- O smoke padrão do Claude também aplica patch da sessão de Sonnet para Opus e verifica que a sessão retomada ainda se lembra de uma observação anterior.

## Live: smoke de bind ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de bind de conversa ACP com um agente ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - fazer bind de uma conversa sintética de canal de mensagens no lugar
  - enviar um follow-up normal nessa mesma conversa
  - verificar que o follow-up chega à transcrição da sessão ACP vinculada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Padrões:
  - Agentes ACP no Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` direto: `claude`
  - Canal sintético: contexto de conversa estilo DM do Slack
  - Backend ACP: `acpx`
- Substituições:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Observações:
  - Essa lane usa a superfície `chat.send` do Gateway com campos sintéticos de rota de origem apenas para administrador para que os testes possam anexar contexto de canal de mensagens sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro embutido de agentes do plugin `acpx` para o agente do harness ACP selecionado.

Exemplo:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Receita Docker:

```bash
pnpm test:docker:live-acp-bind
```

Receitas Docker de agente único:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Observações sobre Docker:

- O runner Docker fica em `scripts/test-live-acp-bind-docker.sh`.
- Por padrão, ele executa o smoke de bind ACP contra todos os agentes CLI live compatíveis em sequência: `claude`, `codex` e depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para restringir a matriz.
- Ele carrega `~/.profile`, prepara o material de auth da CLI correspondente dentro do contêiner, instala `acpx` em um prefixo npm gravável e então instala a CLI live solicitada (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) se estiver ausente.
- Dentro do Docker, o runner define `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que o acpx mantenha as variáveis de env do provedor vindas do profile carregado disponíveis para a CLI filha do harness.

## Live: smoke do harness app-server do Codex

- Objetivo: validar o harness do Codex pertencente ao plugin por meio do método
  `agent` normal do Gateway:
  - carregar o plugin `codex` empacotado
  - selecionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar um primeiro turno de agente do Gateway para `codex/gpt-5.4`
  - enviar um segundo turno para a mesma sessão OpenClaw e verificar que a thread do app-server
    pode ser retomada
  - executar `/codex status` e `/codex models` pelo mesmo caminho
    de comando do Gateway
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo padrão: `codex/gpt-5.4`
- Sonda de imagem opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda opcional de MCP/ferramenta: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- O smoke define `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que um harness Codex
  com problema não consiga passar ao fazer fallback silencioso para PI.
- Auth: `OPENAI_API_KEY` do shell/profile, mais os opcionais copiados
  `~/.codex/auth.json` e `~/.codex/config.toml`

Receita local:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receita Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Observações sobre Docker:

- O runner Docker fica em `scripts/test-live-codex-harness-docker.sh`.
- Ele carrega o `~/.profile` montado, passa `OPENAI_API_KEY`, copia arquivos de auth da CLI Codex quando presentes, instala `@openai/codex` em um prefixo npm montado e gravável, prepara a árvore-fonte e então executa apenas o teste live do harness Codex.
- O Docker habilita por padrão as sondas de imagem e MCP/ferramenta. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` quando precisar de uma execução de depuração mais restrita.
- O Docker também exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, em linha com a config
  do teste live para que fallback para `openai-codex/*` ou PI não consiga esconder uma regressão do harness Codex.

### Receitas live recomendadas

Allowlists restritas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke do Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamada de ferramentas em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco em Google (chave de API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a bridge OAuth Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa a CLI Gemini local na sua máquina (auth separada + quirks próprios de tooling).
- API Gemini vs CLI Gemini:
  - API: o OpenClaw chama a API Gemini hospedada do Google via HTTP (auth por chave de API / perfil); é isso que a maioria dos usuários quer dizer com “Gemini”.
  - CLI: o OpenClaw executa um binário `gemini` local; ele tem sua própria auth e pode se comportar de forma diferente (streaming/suporte a ferramentas/descompasso de versão).

## Live: matriz de modelos (o que cobrimos)

Não existe uma “lista fixa de modelos de CI” (live é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto smoke moderno (chamada de ferramentas + imagem)

Esta é a execução de “modelos comuns” que esperamos manter funcionando:

- OpenAI (não-Codex): `openai/gpt-5.4` (opcional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos antigos Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Execute o smoke do Gateway com ferramentas + imagem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Linha de base: chamada de ferramentas (Read + Exec opcional)

Escolha pelo menos um por família de provedor:

- OpenAI: `openai/gpt-5.4` (ou `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (bom ter):

- xAI: `xai/grok-4` (ou o mais recente disponível)
- Mistral: `mistral/`… (escolha um modelo com suporte a “tools” que você tenha habilitado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; a chamada de ferramentas depende do modo da API)

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo com suporte a imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes OpenAI com suporte a visão etc.) para exercitar a sonda de imagem.

### Agregadores / gateways alternativos

Se você tiver chaves habilitadas, também oferecemos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos com suporte a tool+image)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (auth via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz live (se tiver credenciais/config):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (cloud/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

Dica: não tente fixar “todos os modelos” na documentação. A lista autoritativa é tudo o que `discoverModels(...)` retornar na sua máquina + todas as chaves disponíveis.

## Credenciais (nunca faça commit)

Os testes live descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes live devem encontrar as mesmas chaves.
- Se um teste live disser “sem credenciais”, depure da mesma forma que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de auth por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “chaves de perfil” significa nos testes live)
- Config: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para o home live preparado quando presente, mas não é o armazenamento principal de chaves de perfil)
- As execuções live locais copiam por padrão a config ativa, os arquivos `auth-profiles.json` por agente, o `credentials/` legado e diretórios de auth externos compatíveis para um home temporário de teste; os homes live preparados ignoram `workspace/` e `sandboxes/`, e substituições de caminho `agents.*.workspace` / `agentDir` são removidas para que as sondas fiquem fora do seu workspace real do host.

Se você quiser depender de chaves em env (por exemplo, exportadas no seu `~/.profile`), execute os testes locais depois de `source ~/.profile`, ou use os runners Docker abaixo (eles podem montar `~/.profile` no contêiner).

## Live Deepgram (transcrição de áudio)

- Teste: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Teste: `src/agents/byteplus.live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Substituição opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live de mídia de workflow do ComfyUI

- Teste: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos empacotados do comfy para imagem, vídeo e `music_generate`
  - Ignora cada capacidade a menos que `models.providers.comfy.<capability>` esteja configurado
  - Útil após alterar envio de workflow do comfy, polling, downloads ou registro de plugin

## Live de geração de imagens

- Teste: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera todos os plugins de provedores de geração de imagem registrados
  - Carrega variáveis de env de provedores ausentes do seu shell de login (`~/.profile`) antes de sondar
  - Usa chaves de API live/env antes dos perfis de auth armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem auth/perfil/modelo utilizável
  - Executa as variantes padrão de geração de imagens pela capacidade compartilhada de runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provedores empacotados atualmente cobertos:
  - `openai`
  - `google`
- Restrição opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamento opcional de auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar auth do armazenamento de perfis e ignorar substituições apenas por env

## Live de geração de música

- Teste: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado empacotado de provedores de geração de música
  - Atualmente cobre Google e MiniMax
  - Carrega variáveis de env de provedores do seu shell de login (`~/.profile`) antes de sondar
  - Usa chaves de API live/env antes dos perfis de auth armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem auth/perfil/modelo utilizável
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada apenas por prompt
    - `edit` quando o provedor declara `capabilities.edit.enabled`
  - Cobertura atual da lane compartilhada:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: arquivo live separado do Comfy, não esta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento opcional de auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar auth do armazenamento de perfis e ignorar substituições apenas por env

## Live de geração de vídeo

- Teste: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado empacotado de provedores de geração de vídeo
  - Carrega variáveis de env de provedores do seu shell de login (`~/.profile`) antes de sondar
  - Usa chaves de API live/env antes dos perfis de auth armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem auth/perfil/modelo utilizável
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada apenas por prompt
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada local baseada em buffer na varredura compartilhada
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada local baseada em buffer na varredura compartilhada
  - Provedores atualmente declarados, mas ignorados em `imageToVideo` na varredura compartilhada:
    - `vydra` porque o `veo3` empacotado é apenas texto e o `kling` empacotado exige uma URL de imagem remota
  - Cobertura específica de provedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa `veo3` text-to-video mais uma lane `kling` que usa por padrão um fixture de URL de imagem remota
  - Cobertura live atual de `videoToVideo`:
    - apenas `runway` quando o modelo selecionado é `runway/gen4_aleph`
  - Provedores atualmente declarados, mas ignorados em `videoToVideo` na varredura compartilhada:
    - `alibaba`, `qwen`, `xai` porque esses caminhos atualmente exigem URLs de referência remotas `http(s)` / MP4
    - `google` porque a lane Gemini/Veo compartilhada atual usa entrada local baseada em buffer e esse caminho não é aceito na varredura compartilhada
    - `openai` porque a lane compartilhada atual não garante acesso específico por organização a inpaint/remix de vídeo
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Comportamento opcional de auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar auth do armazenamento de perfis e ignorar substituições apenas por env

## Harness live de mídia

- Comando: `pnpm test:live:media`
- Finalidade:
  - Executa as suítes live compartilhadas de imagem, música e vídeo por um único entrypoint nativo do repositório
  - Carrega automaticamente variáveis de env ausentes de provedores a partir de `~/.profile`
  - Restringe automaticamente por padrão cada suíte aos provedores que atualmente têm auth utilizável
  - Reutiliza `scripts/test-live.mjs`, para que o comportamento de heartbeat e modo silencioso permaneça consistente
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runners Docker (verificações opcionais de "funciona no Linux")

Esses runners Docker se dividem em dois grupos:

- Runners de live-model: `test:docker:live-models` e `test:docker:live-gateway` executam apenas seu arquivo live de chaves de perfil correspondente dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório de config local e workspace (e carregando `~/.profile` se estiver montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Os runners live em Docker usam por padrão um limite smoke menor para que uma varredura Docker completa continue prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas variáveis de env quando
  quiser explicitamente a varredura maior e exaustiva.
- `test:docker:all` constrói a imagem Docker live uma vez via `test:docker:live-build` e então a reutiliza para as duas lanes live em Docker.
- Runners smoke de contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` iniciam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.

Os runners Docker de live-model também fazem bind-mount apenas dos homes de auth de CLI necessários (ou de todos os compatíveis quando a execução não está restrita), depois os copiam para o home do contêiner antes da execução para que o OAuth da CLI externa possa atualizar tokens sem alterar o armazenamento de auth do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness app-server do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Networking do Gateway (dois contêineres, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Bridge de canal MCP (Gateway semeado + bridge stdio + smoke bruto de frame de notificação do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke de instalação + alias `/plugin` + semântica de reinício do bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Os runners Docker de live-model também fazem bind-mount do checkout atual como somente leitura e
o preparam em um workdir temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta e ainda assim executa o Vitest contra seu código-fonte/config local exato.
A etapa de preparação ignora grandes caches apenas locais e saídas de build de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios locais de saída `.build` ou
Gradle, para que execuções live em Docker não passem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que sondas live do Gateway não iniciem
workers reais de canais Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então também passe
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir cobertura live do Gateway
dessa lane Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner do Gateway OpenClaw com os endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner fixo do Open WebUI contra esse Gateway, faz login pelo
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
requisição real de chat pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser visivelmente mais lenta porque o Docker pode precisar baixar a
imagem do Open WebUI e o Open WebUI pode precisar terminar sua própria configuração de cold start.
Essa lane espera uma chave de modelo live utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a forma principal de fornecê-la em execuções Dockerizadas.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicia um contêiner de Gateway
semeado, inicia um segundo contêiner que executa `openclaw mcp serve`, e então
verifica descoberta de conversa roteada, leituras de transcrição, metadados de anexo,
comportamento de fila de eventos live, roteamento de envio de saída e notificações
de canal + permissão no estilo Claude pela bridge MCP stdio real. A verificação de notificação
inspeciona diretamente os frames MCP stdio brutos para que o smoke valide o que a
bridge realmente emite, não apenas o que um SDK cliente específico por acaso expõe.

Smoke manual de thread ACP em linguagem natural (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de regressão/depuração. Ele pode ser necessário novamente para validação de roteamento de thread ACP, então não o exclua.

Variáveis de env úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar os testes
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações CLI em cache dentro do Docker
- Diretórios/arquivos de auth de CLI externa sob `$HOME` são montados como somente leitura em `/host-auth...` e então copiados para `/home/node/...` antes de os testes começarem
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções de provedor restrito montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisam de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfis (não do env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo Gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag de imagem fixa do Open WebUI

## Sanidade da documentação

Execute as verificações de documentação após editar docs: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar de verificações de títulos na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Chamada de ferramentas do Gateway (OpenAI simulado, Gateway real + loop do agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do Gateway (WS `wizard.start`/`wizard.next`, grava config + auth obrigatórios): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como “avaliações de confiabilidade do agente”:

- Chamada simulada de ferramentas pelo Gateway real + loop do agente (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente que validam a fiação da sessão e os efeitos de config (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (veja [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a skill certa (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes de usar e segue as etapas/args obrigatórios?
- **Contratos de workflow:** cenários de múltiplos turnos que validam ordem de ferramentas, persistência de histórico de sessão e limites de sandbox.

As futuras avaliações devem continuar determinísticas primeiro:

- Um runner de cenários usando provedores simulados para validar chamadas de ferramentas + ordem, leituras de arquivos de skill e fiação de sessão.
- Um pequeno conjunto de cenários focados em skills (usar vs evitar, gate, injeção de prompt).
- Avaliações live opcionais (opt-in, controladas por env) apenas depois que a suíte segura para CI estiver pronta.

## Testes de contrato (forma de plugin e canal)

Os testes de contrato verificam se todo plugin e canal registrados estão em conformidade com seu
contrato de interface. Eles iteram sobre todos os plugins descobertos e executam uma suíte de
validações de forma e comportamento. A lane unit padrão de `pnpm test` intencionalmente
ignora esses arquivos compartilhados de seam e smoke; execute os comandos de contrato explicitamente
quando tocar em superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canal: `pnpm test:contracts:channels`
- Apenas contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica do plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de binding de sessão
- **outbound-payload** - Estrutura da carga de mensagem
- **inbound** - Tratamento de mensagens de entrada
- **actions** - Handlers de ações do canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação de política de grupo

### Contratos de status de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de status de canal
- **registry** - Forma do registro de plugins

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato do fluxo de auth
- **auth-choice** - Escolha/seleção de auth
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de plugins
- **loader** - Carregamento de plugins
- **runtime** - Runtime do provedor
- **shape** - Forma/interface do plugin
- **wizard** - Assistente de configuração

### Quando executar

- Depois de alterar exports ou subpaths do Plugin SDK
- Depois de adicionar ou modificar um plugin de canal ou provedor
- Depois de refatorar registro ou descoberta de plugin

Os testes de contrato rodam em CI e não requerem chaves de API reais.

## Adicionando regressões (orientação)

Quando você corrigir um problema de provedor/modelo descoberto em live:

- Adicione uma regressão segura para CI, se possível (provedor simulado/stub, ou capture a transformação exata do formato da requisição)
- Se for inerentemente apenas live (limites de taxa, políticas de auth), mantenha o teste live restrito e opt-in por meio de variáveis de env
- Prefira mirar na menor camada que detecta o bug:
  - bug de conversão/replay de requisição do provedor → teste de modelos diretos
  - bug do pipeline de sessão/histórico/ferramentas do Gateway → smoke live do Gateway ou teste mock do Gateway seguro para CI
- Guardrail de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo de amostra por classe de SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`), então valida que ids de exec de segmento de travessia são rejeitados.
  - Se você adicionar uma nova família de alvo SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser ignoradas em silêncio.
