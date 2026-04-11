---
read_when:
    - Execução de testes localmente ou no CI
    - Adição de testes de regressão para bugs de modelo/provedor
    - Depuração do comportamento do gateway + do agente
summary: 'Kit de testes: suítes unitárias/e2e/ao vivo, executores Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-11T02:45:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55e75d056306a77b0d112a3902c08c7771f53533250847fc3d785b1df3e0e9e7
    source_path: help/testing.md
    workflow: 15
---

# Testes

O OpenClaw tem três suítes Vitest (unitária/integração, e2e, ao vivo) e um pequeno conjunto de executores Docker.

Este documento é um guia de “como testamos”:

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre)
- Quais comandos executar para fluxos comuns (local, pré-push, depuração)
- Como os testes ao vivo descobrem credenciais e selecionam modelos/provedores
- Como adicionar regressões para problemas reais de modelo/provedor

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina folgada: `pnpm test:max`
- Loop direto de watch do Vitest: `pnpm test:watch`
- O direcionamento direto por arquivo agora também roteia caminhos de extensões/canais: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando sobre uma única falha.
- Site de QA com suporte de Docker: `pnpm qa:lab:up`
- Faixa de QA com suporte de VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você altera testes ou quer confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte ao vivo (modelos + sondas de ferramenta/imagem do gateway): `pnpm test:live`
- Direcione um único arquivo ao vivo em modo silencioso: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Dica: quando você só precisa de um caso com falha, prefira restringir os testes ao vivo por meio das variáveis de ambiente de allowlist descritas abaixo.

## Executores específicos de QA

Esses comandos ficam ao lado das principais suítes de teste quando você precisa do realismo do qa-lab:

- `pnpm openclaw qa suite`
  - Executa cenários de QA com suporte do repositório diretamente no host.
  - Executa múltiplos cenários selecionados em paralelo por padrão com workers de gateway isolados, até 64 workers ou a contagem de cenários selecionada. Use `--concurrency <count>` para ajustar a contagem de workers, ou `--concurrency 1` para a faixa serial mais antiga.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux descartável do Multipass.
  - Mantém o mesmo comportamento de seleção de cenários que `qa suite` no host.
  - Reutiliza as mesmas flags de seleção de provedor/modelo que `qa suite`.
  - Execuções ao vivo encaminham as entradas de autenticação de QA compatíveis que são práticas para o convidado:
    chaves de provedor baseadas em env, o caminho de configuração do provedor ao vivo de QA e `CODEX_HOME` quando presente.
  - Os diretórios de saída devem permanecer sob a raiz do repositório para que o convidado possa gravar de volta por meio do workspace montado.
  - Grava o relatório + resumo normais de QA, além dos logs do Multipass, em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA com suporte de Docker para trabalho de QA no estilo operador.
- `pnpm openclaw qa matrix`
  - Executa a faixa de QA ao vivo do Matrix contra um homeserver Tuwunel descartável com suporte de Docker.
  - Provisiona três usuários Matrix temporários (`driver`, `sut`, `observer`) mais uma sala privada, e então inicia um gateway filho de QA com o plugin Matrix real como transporte SUT.
  - Usa por padrão a imagem estável fixada do Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Substitua com `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando precisar testar uma imagem diferente.
  - Grava um relatório de QA do Matrix, resumo e artefato de eventos observados em `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Executa a faixa de QA ao vivo do Telegram contra um grupo privado real usando os tokens de bot do driver e do SUT vindos do env.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação estável bot a bot, habilite o Bot-to-Bot Communication Mode em `@BotFather` para ambos os bots e garanta que o bot driver possa observar o tráfego de bots no grupo.
  - Grava um relatório de QA do Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`.

As faixas de transporte ao vivo compartilham um contrato padrão para que novos transportes não se desviem.

`qa-channel` continua sendo a ampla suíte sintética de QA e não faz parte da matriz de cobertura de transporte ao vivo.

| Faixa    | Canary | Gate de menção | Bloco de allowlist | Resposta de nível superior | Retomada após reinício | Acompanhamento de thread | Isolamento de thread | Observação de reação | Comando de ajuda |
| -------- | ------ | -------------- | ------------------ | -------------------------- | ---------------------- | ------------------------ | -------------------- | -------------------- | ---------------- |
| Matrix   | x      | x              | x                  | x                          | x                      | x                        | x                    | x                    |                  |
| Telegram | x      |                |                    |                            |                        |                          |                      |                      | x                |

## Suítes de teste (o que executa onde)

Pense nas suítes como “realismo crescente” (e flakiness/custo crescentes):

### Unitária / integração (padrão)

- Comando: `pnpm test`
- Configuração: dez execuções sequenciais de shard (`vitest.full-*.config.ts`) sobre os projetos Vitest com escopo já existentes
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes Node de `ui` permitidos cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes puramente unitários
  - Testes de integração em processo (autenticação do gateway, roteamento, ferramentas, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Executa no CI
  - Não requer chaves reais
  - Deve ser rápido e estável
- Observação sobre projetos:
  - `pnpm test` sem alvo agora executa onze configurações de shard menores (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo gigante do projeto raiz nativo. Isso reduz o pico de RSS em máquinas carregadas e evita que o trabalho de auto-reply/extensão sufoque suítes não relacionadas.
  - `pnpm test --watch` ainda usa o grafo de projetos nativo do `vitest.config.ts` da raiz, porque um loop de watch com múltiplos shards não é prático.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` roteiam primeiro alvos explícitos de arquivo/diretório por faixas com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo de inicialização completo do projeto raiz.
  - `pnpm test:changed` expande caminhos git alterados para as mesmas faixas com escopo quando o diff toca apenas arquivos de código-fonte/teste roteáveis; edições de configuração/setup ainda recaem para a reexecução ampla do projeto raiz.
  - Testes unitários leves de importação vindos de agentes, comandos, plugins, auxiliares de auto-reply, `plugin-sdk` e áreas utilitárias puras semelhantes passam pela faixa `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com estado/runtime pesado permanecem nas faixas existentes.
  - Alguns arquivos auxiliares de origem de `plugin-sdk` e `commands` também mapeiam execuções em modo changed para testes irmãos explícitos nessas faixas leves, de modo que edições em auxiliares evitem reexecutar a suíte pesada completa desse diretório.
  - `auto-reply` agora tem três buckets dedicados: auxiliares core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. Isso mantém o trabalho mais pesado do harness de reply fora dos testes baratos de status/chunk/token.
- Observação sobre o executor embutido:
  - Quando você altera entradas de descoberta da ferramenta de mensagem ou o contexto de runtime de compactação,
    mantenha ambos os níveis de cobertura.
  - Adicione regressões focadas de helper para limites puros de roteamento/normalização.
  - Também mantenha saudáveis as suítes de integração do executor embutido:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Essas suítes verificam que ids com escopo e o comportamento de compactação ainda fluem pelos caminhos reais de `run.ts` / `compact.ts`; testes somente de helper não são um substituto suficiente para esses caminhos de integração.
- Observação sobre pool:
  - A configuração base do Vitest agora usa `threads` por padrão.
  - A configuração compartilhada do Vitest também fixa `isolate: false` e usa o executor não isolado nos projetos raiz, e2e e ao vivo.
  - A faixa raiz de UI mantém sua configuração `jsdom` e otimizador, mas agora também executa no executor não isolado compartilhado.
  - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração compartilhada do Vitest.
  - O iniciador compartilhado `scripts/run-vitest.mjs` agora também adiciona `--no-maglev` por padrão aos processos Node filhos do Vitest para reduzir churn de compilação do V8 durante grandes execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se precisar comparar com o comportamento padrão do V8.
- Observação sobre iteração local rápida:
  - `pnpm test:changed` roteia por faixas com escopo quando os caminhos alterados mapeiam de forma limpa para uma suíte menor.
  - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento, apenas com um limite maior de workers.
  - O autoescalonamento local de workers agora é intencionalmente conservador e também recua quando a média de carga do host já está alta, para que múltiplas execuções simultâneas do Vitest causem menos impacto por padrão.
  - A configuração base do Vitest marca os projetos/arquivos de configuração como `forceRerunTriggers`, para que reexecuções em modo changed permaneçam corretas quando a fiação dos testes mudar.
  - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser um local explícito de cache para profiling direto.
- Observação sobre depuração de desempenho:
  - `pnpm test:perf:imports` habilita relatórios de duração de importação do Vitest e saída de detalhamento de importação.
  - `pnpm test:perf:imports:changed` restringe a mesma visualização de profiling aos arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` roteado com o caminho nativo do projeto raiz para aquele diff com commit e imprime tempo total e RSS máximo no macOS.
- `pnpm test:perf:changed:bench -- --worktree` mede a árvore de trabalho suja atual roteando a lista de arquivos alterados por `scripts/test-projects.mjs` e pela configuração Vitest do projeto raiz.
  - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para sobrecarga de inicialização e transformação de Vitest/Vite.
  - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do executor para a suíte unitária com paralelismo de arquivos desabilitado.

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, em linha com o restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Executa em modo silencioso por padrão para reduzir a sobrecarga de I/O no console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reativar saída detalhada no console.
- Escopo:
  - Comportamento end-to-end do gateway em múltiplas instâncias
  - Superfícies WebSocket/HTTP, emparelhamento de nós e rede mais pesada
- Expectativas:
  - Executa no CI (quando habilitado no pipeline)
  - Não requer chaves reais
  - Tem mais partes móveis do que os testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `test/openshell-sandbox.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenClaw OpenShell sobre `sandbox ssh-config` real + execução SSH
  - Verifica o comportamento canônico remoto do sistema de arquivos por meio da bridge fs do sandbox
- Expectativas:
  - Somente opt-in; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer uma CLI `openshell` local e um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados, e então destrói o gateway de teste e o sandbox
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou script wrapper

### Ao vivo (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Este provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Capturar mudanças de formato do provedor, peculiaridades de chamada de ferramentas, problemas de autenticação e comportamento de limite de taxa
- Expectativas:
  - Não é estável em CI por definição (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos reduzidos em vez de “tudo”
- Execuções ao vivo carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções ao vivo ainda isolam `HOME` e copiam material de configuração/autenticação para um diretório temporário de teste, para que fixtures unitários não possam alterar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` somente quando você realmente precisar que os testes ao vivo usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do gateway/chatter do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de inicialização de volta.
- Rotação de chaves de API (específica por provedor): defina `*_API_KEYS` no formato com vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por execução ao vivo com `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/heartbeat:
  - As suítes ao vivo agora emitem linhas de progresso para stderr, para que chamadas longas ao provedor permaneçam visivelmente ativas mesmo quando a captura de console do Vitest estiver silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso do provedor/gateway sejam transmitidas imediatamente durante execuções ao vivo.
  - Ajuste heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste heartbeats de gateway/sonda com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você alterou muita coisa)
- Alterando rede do gateway / protocolo WS / emparelhamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provedor / chamada de ferramenta: execute um `pnpm test:live` reduzido

## Ao vivo: varredura de capacidades de nó Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todo comando atualmente anunciado** por um nó Android conectado e validar o comportamento do contrato do comando.
- Escopo:
  - Configuração prévia/manual (a suíte não instala/executa/emparelha o app).
  - Validação comando por comando de `node.invoke` do gateway para o nó Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado e emparelhado ao gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capacidades que você espera que passem.
- Substituições opcionais de destino:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos da configuração do Android: [App Android](/pt-BR/platforms/android)

## Ao vivo: smoke de modelo (chaves de perfil)

Os testes ao vivo são divididos em duas camadas para que possamos isolar falhas:

- “Modelo direto” nos informa se o provedor/modelo consegue responder com a chave fornecida.
- “Smoke do gateway” nos informa se o pipeline completo gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta do modelo (sem gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar os modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente executar esta suíte; caso contrário ela é ignorada para manter `pnpm test:live` focado no smoke do gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a allowlist moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por vírgulas)
  - Varreduras modern/all usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfis e fallbacks de env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **somente o armazenamento de perfis**
- Por que isso existe:
  - Separa “a API do provedor está quebrada / a chave é inválida” de “o pipeline do agente do gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: replay de raciocínio do OpenAI Responses/Codex Responses + fluxos de chamada de ferramenta)

### Camada 2: smoke do gateway + agente dev (o que `@openclaw` realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Iniciar um gateway em processo
  - Criar/atualizar uma sessão `agent:dev:*` (substituição de modelo por execução)
  - Iterar por modelos com chaves e verificar:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (sonda de leitura)
    - sondas opcionais de ferramenta extra (sonda exec+read)
    - caminhos de regressão do OpenAI (somente chamada de ferramenta → acompanhamento) continuam funcionando
- Detalhes das sondas (para que você possa explicar falhas rapidamente):
  - sonda `read`: o teste grava um arquivo nonce no workspace e pede ao agente para `read` ele e ecoar o nonce de volta.
  - sonda `exec+read`: o teste pede ao agente para gravar um nonce em um arquivo temporário via `exec` e depois `read` esse arquivo.
  - sonda de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a allowlist moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - Varreduras de gateway modern/all usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores (evite “OpenRouter tudo”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por vírgulas)
- As sondas de ferramenta + imagem estão sempre ativadas neste teste ao vivo:
  - sonda `read` + sonda `exec+read` (estresse de ferramenta)
  - a sonda de imagem é executada quando o modelo anuncia suporte para entrada de imagem
  - Fluxo (alto nível):
    - O teste gera um PNG minúsculo com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O gateway analisa anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente embutido encaminha uma mensagem de usuário multimodal ao modelo
    - Verificação: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são permitidos)

Dica: para ver o que você pode testar na sua máquina (e os ids exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

## Ao vivo: smoke de backend de CLI (Claude, Codex, Gemini ou outras CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline Gateway + agente usando um backend de CLI local, sem tocar na sua configuração padrão.
- Os padrões de smoke específicos de backend vivem na definição `cli-backend.ts` da extensão proprietária.
- Habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - Comportamento de comando/args/imagem vem dos metadados do plugin proprietário do backend de CLI.
- Substituições (opcionais):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (os caminhos são injetados no prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivo de imagem como args da CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como os args de imagem são passados quando `IMAGE_ARG` estiver definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para desabilitar a sonda padrão de continuidade na mesma sessão Claude Sonnet -> Opus (defina como `1` para forçá-la quando o modelo selecionado oferecer suporte a um destino de troca).

Exemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Receita com Docker:

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

- O executor Docker fica em `scripts/test-live-cli-backend-docker.sh`.
- Ele executa o smoke ao vivo do backend de CLI dentro da imagem Docker do repositório como o usuário não root `node`.
- Ele resolve metadados de smoke da CLI a partir da extensão proprietária e então instala o pacote de CLI Linux correspondente (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) em um prefixo gravável com cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requer OAuth portátil de assinatura do Claude Code por meio de `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primeiro ele prova `claude -p` direto no Docker e depois executa dois turnos do backend de CLI do Gateway sem preservar variáveis de env de chave de API da Anthropic. Essa faixa de assinatura desabilita por padrão as sondas MCP/tool e de imagem do Claude, porque atualmente o Claude roteia o uso de apps de terceiros por cobrança de uso extra em vez dos limites normais do plano de assinatura.
- O smoke ao vivo do backend de CLI agora exercita o mesmo fluxo end-to-end para Claude, Codex e Gemini: turno de texto, turno de classificação de imagem e depois chamada de ferramenta MCP `cron` verificada via a CLI do gateway.
- O smoke padrão do Claude também atualiza a sessão de Sonnet para Opus e verifica que a sessão retomada ainda se lembra de uma observação anterior.

## Ao vivo: smoke de bind ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de bind de conversa ACP com um agente ACP ao vivo:
  - enviar `/acp spawn <agent> --bind here`
  - vincular em lugar uma conversa sintética de canal de mensagens
  - enviar um acompanhamento normal nessa mesma conversa
  - verificar que o acompanhamento chega ao transcript da sessão ACP vinculada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Padrões:
  - Agentes ACP no Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` direto: `claude`
  - Canal sintético: contexto de conversa no estilo DM do Slack
  - Backend ACP: `acpx`
- Substituições:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Observações:
  - Essa faixa usa a superfície `chat.send` do gateway com campos sintéticos de rota de origem somente para admin, para que os testes possam anexar contexto de canal de mensagens sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não estiver definido, o teste usa o registro de agentes integrado do plugin embutido `acpx` para o agente de harness ACP selecionado.

Exemplo:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Receita com Docker:

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

- O executor Docker fica em `scripts/test-live-acp-bind-docker.sh`.
- Por padrão, ele executa o smoke de bind ACP contra todos os agentes de CLI ao vivo compatíveis em sequência: `claude`, `codex`, depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para restringir a matriz.
- Ele carrega `~/.profile`, prepara o material de autenticação da CLI correspondente no contêiner, instala `acpx` em um prefixo npm gravável e então instala a CLI ao vivo solicitada (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) se estiver ausente.
- Dentro do Docker, o executor define `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que o acpx mantenha disponíveis para a CLI filha do harness as variáveis de env do provedor vindas do profile carregado.

## Ao vivo: smoke do harness app-server do Codex

- Objetivo: validar o harness Codex de propriedade do plugin pelo método normal
  `agent` do gateway:
  - carregar o plugin empacotado `codex`
  - selecionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar um primeiro turno do agente do gateway para `codex/gpt-5.4`
  - enviar um segundo turno para a mesma sessão OpenClaw e verificar se a thread do app-server pode ser retomada
  - executar `/codex status` e `/codex models` pelo mesmo caminho de comando do gateway
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo padrão: `codex/gpt-5.4`
- Sonda opcional de imagem: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda opcional de MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- O smoke define `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, para que um harness Codex
  quebrado não passe por fallback silencioso para PI.
- Autenticação: `OPENAI_API_KEY` do shell/profile, mais cópia opcional de
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

Receita com Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Observações sobre Docker:

- O executor Docker fica em `scripts/test-live-codex-harness-docker.sh`.
- Ele carrega o `~/.profile` montado, passa `OPENAI_API_KEY`, copia arquivos de autenticação da CLI Codex quando presentes, instala `@openai/codex` em um prefixo npm gravável montado, prepara a árvore de origem e então executa somente o teste ao vivo do harness Codex.
- O Docker habilita por padrão as sondas de imagem e MCP/tool. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` quando precisar de uma execução de depuração mais restrita.
- O Docker também exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, em linha com a configuração de teste ao vivo, para que fallback para `openai-codex/*` ou PI não possa ocultar uma regressão do harness Codex.

### Receitas recomendadas para testes ao vivo

Allowlists restritas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke do gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamada de ferramentas em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco no Google (chave de API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a bridge OAuth Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa a CLI Gemini local na sua máquina (autenticação separada + peculiaridades de ferramentas).
- API Gemini vs CLI Gemini:
  - API: o OpenClaw chama a API Gemini hospedada do Google por HTTP (chave de API / autenticação de perfil); é isso que a maioria dos usuários quer dizer com “Gemini”.
  - CLI: o OpenClaw executa um binário local `gemini`; ele tem sua própria autenticação e pode se comportar de forma diferente (streaming/suporte a ferramentas/desalinhamento de versão).

## Ao vivo: matriz de modelos (o que cobrimos)

Não existe uma “lista fixa de modelos de CI” (ao vivo é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto smoke moderno (chamada de ferramentas + imagem)

Esta é a execução de “modelos comuns” que esperamos continuar funcionando:

- OpenAI (não-Codex): `openai/gpt-5.4` (opcional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos Gemini 2.x mais antigos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Execute o smoke do gateway com ferramentas + imagem:
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
- Mistral: `mistral/`… (escolha um modelo com capacidade de “tools” que você tenha habilitado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; a chamada de ferramentas depende do modo da API)

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo com capacidade de imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes com suporte a visão de Claude/Gemini/OpenAI etc.) para exercitar a sonda de imagem.

### Agregadores / gateways alternativos

Se você tiver chaves habilitadas, também damos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos com capacidade de ferramenta+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (autenticação via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz ao vivo (se tiver credenciais/configuração):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (nuvem/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

Dica: não tente fixar “todos os modelos” na documentação. A lista autoritativa é o que `discoverModels(...)` retorna na sua máquina + as chaves que estiverem disponíveis.

## Credenciais (nunca faça commit)

Os testes ao vivo descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes ao vivo devem encontrar as mesmas chaves.
- Se um teste ao vivo disser “sem credenciais”, depure da mesma forma que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de autenticação por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “chaves de perfil” significa nos testes ao vivo)
- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para o home ao vivo preparado quando presente, mas não é o armazenamento principal de chaves de perfil)
- Execuções locais ao vivo copiam por padrão a configuração ativa, arquivos `auth-profiles.json` por agente, `credentials/` legado e diretórios compatíveis de autenticação de CLI externa para um home temporário de teste; homes ao vivo preparados ignoram `workspace/` e `sandboxes/`, e substituições de caminho `agents.*.workspace` / `agentDir` são removidas para que as sondas não atinjam seu workspace real do host.

Se você quiser depender de chaves de env (por exemplo, exportadas no seu `~/.profile`), execute os testes locais após `source ~/.profile`, ou use os executores Docker abaixo (eles podem montar `~/.profile` no contêiner).

## Deepgram ao vivo (transcrição de áudio)

- Teste: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan ao vivo

- Teste: `src/agents/byteplus.live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Substituição opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media ao vivo

- Teste: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos empacotados do comfy para imagem, vídeo e `music_generate`
  - Ignora cada capacidade, a menos que `models.providers.comfy.<capability>` esteja configurado
  - Útil após alterar envio de workflow do comfy, polling, downloads ou registro do plugin

## Geração de imagem ao vivo

- Teste: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera todos os plugins de provedor de geração de imagem registrados
  - Carrega variáveis de env ausentes do provedor a partir do seu shell de login (`~/.profile`) antes da sondagem
  - Usa chaves de API ao vivo/do env antes dos perfis de autenticação armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa as variantes padrão de geração de imagem por meio da capacidade compartilhada de runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provedores empacotados atuais cobertos:
  - `openai`
  - `google`
- Restrição opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar substituições somente por env

## Geração de música ao vivo

- Teste: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado do provedor empacotado de geração de música
  - Atualmente cobre Google e MiniMax
  - Carrega variáveis de env do provedor a partir do seu shell de login (`~/.profile`) antes da sondagem
  - Usa chaves de API ao vivo/do env antes dos perfis de autenticação armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada somente de prompt
    - `edit` quando o provedor declara `capabilities.edit.enabled`
  - Cobertura atual da faixa compartilhada:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: arquivo ao vivo separado do Comfy, não esta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar substituições somente por env

## Geração de vídeo ao vivo

- Teste: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado do provedor empacotado de geração de vídeo
  - Carrega variáveis de env do provedor a partir do seu shell de login (`~/.profile`) antes da sondagem
  - Usa chaves de API ao vivo/do env antes dos perfis de autenticação armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada somente de prompt
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada de imagem local com buffer na varredura compartilhada
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada de vídeo local com buffer na varredura compartilhada
  - Provedores atualmente declarados, mas ignorados, de `imageToVideo` na varredura compartilhada:
    - `vydra`, porque o `veo3` empacotado é somente texto e o `kling` empacotado exige uma URL de imagem remota
  - Cobertura específica de provedor do Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa `veo3` texto para vídeo e também uma faixa `kling` que usa por padrão uma fixture de URL de imagem remota
  - Cobertura atual ao vivo de `videoToVideo`:
    - somente `runway` quando o modelo selecionado é `runway/gen4_aleph`
  - Provedores atualmente declarados, mas ignorados, de `videoToVideo` na varredura compartilhada:
    - `alibaba`, `qwen`, `xai`, porque esses caminhos atualmente exigem URLs de referência remotas `http(s)` / MP4
    - `google`, porque a faixa compartilhada atual de Gemini/Veo usa entrada local com buffer e esse caminho não é aceito na varredura compartilhada
    - `openai`, porque a faixa compartilhada atual não tem garantias de acesso específico por organização para inpaint/remix de vídeo
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar substituições somente por env

## Harness de mídia ao vivo

- Comando: `pnpm test:live:media`
- Finalidade:
  - Executa as suítes compartilhadas ao vivo de imagem, música e vídeo por um único entrypoint nativo do repositório
  - Carrega automaticamente variáveis de env ausentes do provedor a partir de `~/.profile`
  - Restringe automaticamente cada suíte por padrão aos provedores que atualmente têm autenticação utilizável
  - Reutiliza `scripts/test-live.mjs`, para que o comportamento de heartbeat e modo silencioso permaneça consistente
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Executores Docker (verificações opcionais de "funciona no Linux")

Esses executores Docker se dividem em dois grupos:

- Executores de modelos ao vivo: `test:docker:live-models` e `test:docker:live-gateway` executam apenas seu arquivo ao vivo correspondente de chaves de perfil dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de configuração e workspace (e carregando `~/.profile` se estiver montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Os executores Docker ao vivo usam por padrão um limite smoke menor para que uma varredura Docker completa continue prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas variáveis de env quando você
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` compila a imagem Docker ao vivo uma vez por meio de `test:docker:live-build`, depois a reutiliza para as duas faixas Docker ao vivo.
- Executores smoke de contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` iniciam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.

Os executores Docker de modelos ao vivo também fazem bind-mount apenas dos homes de autenticação de CLI necessários (ou de todos os compatíveis quando a execução não está restrita), depois os copiam para o home do contêiner antes da execução, para que OAuth de CLI externa possa renovar tokens sem alterar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke de backend de CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness app-server do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke ao vivo do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Rede do gateway (dois contêineres, autenticação WS + integridade): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Bridge de canal MCP (Gateway inicializado com seed + bridge stdio + smoke bruto de frame de notificação do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke de instalação + alias `/plugin` + semântica de reinício do bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Os executores Docker de modelos ao vivo também fazem bind-mount do checkout atual como somente leitura e
o preparam em um workdir temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta, enquanto ainda executa o Vitest contra seu código-fonte/configuração local exato.
A etapa de preparação ignora grandes caches somente locais e saídas de build do app, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios locais do app `.build` ou
saídas do Gradle, para que execuções Docker ao vivo não passem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que sondas ao vivo do gateway não iniciem
workers reais de canal do Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, portanto repasse
`OPENCLAW_LIVE_GATEWAY_*` também quando precisar restringir ou excluir a cobertura ao vivo do gateway dessa faixa Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner do gateway OpenClaw com os endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner fixado do Open WebUI contra esse gateway, faz login pelo
Open WebUI, verifica que `/api/models` expõe `openclaw/default` e então envia uma
solicitação de chat real por meio do proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser visivelmente mais lenta, porque o Docker pode precisar baixar a
imagem do Open WebUI e o Open WebUI pode precisar concluir sua própria configuração de inicialização a frio.
Essa faixa espera uma chave de modelo ao vivo utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a forma principal de fornecê-la em execuções com Docker.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicia um contêiner de Gateway
inicializado com seed, inicia um segundo contêiner que executa `openclaw mcp serve` e então
verifica descoberta de conversa roteada, leituras de transcript, metadados de anexo,
comportamento da fila de eventos ao vivo, roteamento de envio de saída e notificações no estilo Claude de canal +
permissão sobre a bridge MCP stdio real. A verificação de notificação
inspeciona diretamente os frames MCP stdio brutos, de modo que o smoke valida o que a
bridge realmente emite, não apenas o que um SDK específico de cliente por acaso expõe.

Smoke manual de thread ACP em linguagem simples (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de regressão/depuração. Ele pode ser necessário novamente para validação de roteamento de thread ACP, portanto não o exclua.

Variáveis de env úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar os testes
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações de CLI em cache dentro do Docker
- Diretórios/arquivos de autenticação de CLI externa sob `$HOME` são montados como somente leitura em `/host-auth...` e então copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções restritas por provedor montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisam de nova compilação
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfis (não do env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag de imagem fixada do Open WebUI

## Sanidade da documentação

Execute verificações de documentação após edições nos docs: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando você também precisar de verificações de cabeçalhos na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Chamada de ferramenta do gateway (OpenAI simulado, gateway real + loop do agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do gateway (WS `wizard.start`/`wizard.next`, gravação forçada de config + auth): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como “avaliações de confiabilidade do agente”:

- Chamada simulada de ferramenta por meio do loop real do gateway + agente (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente que validam a conexão da sessão e os efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (consulte [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando as Skills estão listadas no prompt, o agente escolhe a Skill correta (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/args exigidos?
- **Contratos de fluxo de trabalho:** cenários de múltiplos turnos que verificam ordem de ferramentas, transporte do histórico da sessão e limites do sandbox.

As avaliações futuras devem permanecer determinísticas primeiro:

- Um executor de cenários usando provedores simulados para verificar chamadas de ferramenta + ordem, leituras de arquivos de Skill e conexão de sessão.
- Uma pequena suíte de cenários focados em Skills (usar vs evitar, gating, injeção de prompt).
- Avaliações ao vivo opcionais (opt-in, controladas por env) somente depois que a suíte segura para CI estiver pronta.

## Testes de contrato (forma de plugin e canal)

Os testes de contrato verificam que todo plugin e canal registrado está em conformidade com seu contrato de interface. Eles iteram sobre todos os plugins descobertos e executam uma suíte de verificações de forma e comportamento. A faixa unitária padrão `pnpm test` intencionalmente ignora esses arquivos compartilhados de seam e smoke; execute os comandos de contrato explicitamente quando alterar superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canal: `pnpm test:contracts:channels`
- Apenas contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica do plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vinculação de sessão
- **outbound-payload** - Estrutura do payload de mensagem
- **inbound** - Tratamento de mensagem de entrada
- **actions** - Manipuladores de ações do canal
- **threading** - Tratamento de id de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação de política de grupo

### Contratos de status do provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de status do canal
- **registry** - Forma do registro de plugins

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de plugin
- **loader** - Carregamento de plugin
- **runtime** - Runtime do provedor
- **shape** - Forma/interface do plugin
- **wizard** - Assistente de configuração

### Quando executar

- Após alterar exportações ou subcaminhos do plugin-sdk
- Após adicionar ou modificar um plugin de canal ou provedor
- Após refatorar registro ou descoberta de plugins

Os testes de contrato são executados no CI e não exigem chaves de API reais.

## Adição de regressões (orientações)

Quando você corrige um problema de provedor/modelo descoberto em testes ao vivo:

- Adicione uma regressão segura para CI, se possível (provedor simulado/stub, ou capture a transformação exata do formato da solicitação)
- Se for inerentemente apenas ao vivo (limites de taxa, políticas de autenticação), mantenha o teste ao vivo restrito e opt-in por meio de variáveis de env
- Prefira atingir a menor camada que capture o bug:
  - bug de conversão/replay de solicitação do provedor → teste direto de modelos
  - bug do pipeline de sessão/histórico/ferramenta do gateway → smoke ao vivo do gateway ou teste seguro para CI com mock do gateway
- Proteção para travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo de amostra por classe de SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`), então verifica se ids exec de segmento de travessia são rejeitados.
  - Se você adicionar uma nova família de alvo SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.
