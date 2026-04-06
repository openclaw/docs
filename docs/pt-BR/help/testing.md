---
read_when:
    - Executando testes localmente ou em CI
    - Adicionando regressões para bugs de modelo/provedor
    - Depurando o comportamento do gateway + agente
summary: 'Kit de testes: suítes unit/e2e/live, runners Docker e o que cada teste cobre'
title: Testing
x-i18n:
    generated_at: "2026-04-06T03:09:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfa174e565df5fdf957234b7909beaf1304aa026e731cc2c433ca7d931681b56
    source_path: help/testing.md
    workflow: 15
---

# Testing

O OpenClaw tem três suítes Vitest (unit/integration, e2e, live) e um pequeno conjunto de runners Docker.

Esta documentação é um guia de “como testamos”:

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre)
- Quais comandos executar para fluxos comuns (local, antes de push, depuração)
- Como os testes live descobrem credenciais e selecionam modelos/provedores
- Como adicionar regressões para problemas reais de modelo/provedor

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes de fazer push): `pnpm build && pnpm check && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina robusta: `pnpm test:max`
- Loop direto de watch do Vitest (config moderna de projects): `pnpm test:watch`
- O direcionamento direto de arquivo agora também roteia caminhos de extensão/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`

Quando você altera testes ou quer confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte live (modelos + sondagens de ferramenta/imagem do gateway): `pnpm test:live`
- Direcione um arquivo live de forma silenciosa: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Dica: quando você precisa apenas de um caso com falha, prefira restringir os testes live com as variáveis de ambiente allowlist descritas abaixo.

## Suítes de teste (o que roda onde)

Pense nas suítes como “realismo crescente” (e crescente instabilidade/custo):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Configuração: `projects` nativo do Vitest via `vitest.config.ts`
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes node do `ui` na allowlist cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes unitários puros
  - Testes de integração no processo (autenticação do gateway, roteamento, ferramentas, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda em CI
  - Não requer chaves reais
  - Deve ser rápido e estável
- Observação sobre projects:
  - `pnpm test`, `pnpm test:watch` e `pnpm test:changed` agora usam a mesma configuração root `projects` nativa do Vitest.
  - Filtros diretos de arquivo roteiam nativamente pelo grafo de projects root, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` funciona sem wrapper personalizado.
- Observação sobre embedded runner:
  - Quando você alterar entradas de descoberta de message-tool ou o contexto de runtime de compactação,
    mantenha os dois níveis de cobertura.
  - Adicione regressões focadas em helpers para limites puros de roteamento/normalização.
  - Também mantenha saudáveis as suítes de integração do embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Essas suítes verificam que ids com escopo e o comportamento de compactação ainda fluem
    pelos caminhos reais `run.ts` / `compact.ts`; testes só de helper não são um
    substituto suficiente para esses caminhos de integração.
- Observação sobre pool:
  - A configuração base do Vitest agora usa `threads` por padrão.
  - A configuração compartilhada do Vitest também fixa `isolate: false` e usa o runner não isolado nos projects root, nas configs e2e e live.
  - A lane UI root mantém sua configuração `jsdom` e seu optimizer, mas agora roda no runner compartilhado não isolado também.
  - `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração `projects` em `vitest.config.ts`.
  - O launcher compartilhado `scripts/run-vitest.mjs` agora também adiciona `--no-maglev` por padrão para processos filho Node do Vitest para reduzir churn de compilação do V8 durante grandes execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se você precisar comparar com o comportamento padrão do V8.
- Observação sobre iteração local rápida:
  - `pnpm test:changed` executa a configuração nativa de projects com `--changed origin/main`.
  - `pnpm test:max` e `pnpm test:changed:max` mantêm a mesma configuração nativa de projects, apenas com um limite maior de workers.
  - O escalonamento automático de workers locais agora é intencionalmente conservador e também recua quando a carga média do host já está alta, então múltiplas execuções simultâneas do Vitest causam menos impacto por padrão.
  - A configuração base do Vitest marca os arquivos de project/config como `forceRerunTriggers` para que reruns no modo changed permaneçam corretos quando a fiação de testes muda.
  - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` ativado em hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se você quiser um local explícito de cache para profiling direto.
- Observação sobre depuração de performance:
  - `pnpm test:perf:imports` ativa relatórios de duração de importação do Vitest mais a saída de detalhamento de importações.
  - `pnpm test:perf:imports:changed` restringe a mesma visualização de profiling a arquivos alterados desde `origin/main`.
  - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para overhead de inicialização e transformação do Vitest/Vite.
  - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a suíte unit com paralelismo por arquivo desativado.

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Padrões de runtime:
  - Usa Vitest `threads` com `isolate: false`, alinhado com o restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Roda em modo silencioso por padrão para reduzir overhead de I/O no console.
- Sobrescritas úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reativar saída detalhada no console.
- Escopo:
  - Comportamento end-to-end de múltiplas instâncias do gateway
  - Superfícies WebSocket/HTTP, pareamento de nó e rede mais pesada
- Expectativas:
  - Roda em CI (quando ativado no pipeline)
  - Não requer chaves reais
  - Tem mais partes móveis que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `test/openshell-sandbox.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw sobre `sandbox ssh-config` real + execução SSH
  - Verifica o comportamento canônico remoto do sistema de arquivos por meio da ponte fs do sandbox
- Expectativas:
  - Apenas opt-in; não faz parte da execução padrão `pnpm test:e2e`
  - Requer uma CLI local `openshell` mais um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados, depois destrói o gateway de teste e o sandbox
- Sobrescritas úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para ativar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou um script wrapper

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`
- Padrão: **ativado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Esse provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Capturar mudanças de formato do provedor, peculiaridades de tool calling, problemas de autenticação e comportamento de limite de taxa
- Expectativas:
  - Não é estável em CI por design (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / consome limites de taxa
  - Prefira executar subconjuntos restritos em vez de “tudo”
- Execuções live carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/auth para uma home de teste temporária, para que fixtures unit não possam modificar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando você intencionalmente precisar que os testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: ele mantém a saída de progresso `[live] ...`, mas suprime o aviso extra sobre `~/.profile` e silencia logs de bootstrap do gateway/chatter Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de inicialização de volta.
- Rotação de chaves de API (específica por provedor): defina `*_API_KEYS` no formato vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou uma sobrescrita por live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/heartbeat:
  - As suítes live agora emitem linhas de progresso para stderr para que chamadas longas ao provedor mostrem atividade visível mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desativa a interceptação de console do Vitest para que linhas de progresso de provedor/gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste heartbeats de gateway/probe com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se mudou muita coisa)
- Alterando rede do gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot está fora do ar” / falhas específicas de provedor / tool calling: execute um `pnpm test:live` restrito

## Live: varredura de capacidades do nó Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todos os comandos atualmente anunciados** por um nó Android conectado e afirmar o comportamento contratual dos comandos.
- Escopo:
  - Configuração manual/pré-condicionada (a suíte não instala/executa/pareia o app).
  - Validação `node.invoke` do gateway, comando por comando, para o nó Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado + pareado ao gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capacidades que você espera que passem.
- Sobrescritas opcionais de alvo:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos da configuração Android: [Android App](/pt-BR/platforms/android)

## Live: smoke de modelo (chaves de perfil)

Os testes live são divididos em duas camadas para podermos isolar falhas:

- “Modelo direto” informa se o provedor/modelo consegue responder com a chave fornecida.
- “Smoke do gateway” informa se o pipeline completo gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta do modelo (sem gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente executar esta suíte; caso contrário, ela é pulada para manter `pnpm test:live` focado no smoke do gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a allowlist moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por vírgulas)
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity"` (allowlist separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfis e fallbacks de ambiente
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para impor **apenas** o armazenamento de perfis
- Por que isso existe:
  - Separa “a API do provedor está quebrada / a chave é inválida” de “o pipeline de agente do gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: replay de raciocínio do OpenAI Responses/Codex Responses + fluxos de tool-call)

### Camada 2: smoke do gateway + agente dev (o que `@openclaw` realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Subir um gateway em processo
  - Criar/aplicar patch em uma sessão `agent:dev:*` (sobrescrita de modelo por execução)
  - Iterar modelos-com-chave e afirmar:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (sondagem read)
    - sondagens opcionais extras de ferramenta (sondagem exec+read)
    - caminhos de regressão do OpenAI (somente tool-call → follow-up) continuam funcionando
- Detalhes da sondagem (para que você possa explicar falhas rapidamente):
  - sondagem `read`: o teste grava um arquivo nonce no workspace e pede ao agente que faça `read` nele e ecoe o nonce de volta.
  - sondagem `exec+read`: o teste pede ao agente para gravar via `exec` um nonce em um arquivo temporário e depois lê-lo de volta com `read`.
  - sondagem de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a allowlist moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
- Como selecionar provedores (evite “OpenRouter tudo”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,openai,anthropic,zai,minimax"` (allowlist separada por vírgulas)
- As sondagens de ferramenta + imagem estão sempre ativadas neste teste live:
  - sondagem `read` + sondagem `exec+read` (estresse de ferramenta)
  - a sondagem de imagem roda quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (nível alto):
    - O teste gera um pequeno PNG com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia-o via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O gateway analisa anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente embutido encaminha uma mensagem de usuário multimodal ao modelo
    - Afirmação: a resposta contém `cat` + o código (tolerância OCR: pequenos erros são permitidos)

Dica: para ver o que você pode testar na sua máquina (e os ids exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke de bind ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de bind de conversa ACP com um agente ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - fazer bind de uma conversa sintética de message-channel no lugar
  - enviar um follow-up normal na mesma conversa
  - verificar que o follow-up chega na transcrição da sessão ACP vinculada
- Ativar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Padrões:
  - Agente ACP: `claude`
  - Canal sintético: contexto de conversa estilo Slack DM
  - Backend ACP: `acpx`
- Sobrescritas:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Observações:
  - Esta lane usa a superfície `chat.send` do gateway com campos admin-only de origem sintética para que os testes possam anexar contexto de canal de mensagem sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro embutido de agentes do plugin `acpx` para o agente de harness ACP selecionado.

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

Observações sobre Docker:

- O runner Docker está em `scripts/test-live-acp-bind-docker.sh`.
- Ele carrega `~/.profile`, prepara no container o material correspondente de autenticação da CLI, instala `acpx` em um prefixo npm gravável e depois instala a CLI live solicitada (`@anthropic-ai/claude-code` ou `@openai/codex`) se estiver ausente.
- Dentro do Docker, o runner define `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que o acpx mantenha disponíveis à CLI filha do harness as variáveis de ambiente do provedor vindas do profile carregado.

### Receitas live recomendadas

Allowlists estreitas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke do gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco em Google (chave de API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a ponte OAuth Antigravity (endpoint de agente no estilo Cloud Code Assist).

## Live: matriz de modelos (o que cobrimos)

Não existe uma “lista fixa de modelos de CI” (live é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto smoke moderno (tool calling + imagem)

Esta é a execução de “modelos comuns” que esperamos manter funcionando:

- OpenAI (não-Codex): `openai/gpt-5.4` (opcional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos Gemini 2.x mais antigos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Execute smoke do gateway com ferramentas + imagem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Base: tool calling (Read + Exec opcional)

Escolha pelo menos um por família de provedor:

- OpenAI: `openai/gpt-5.4` (ou `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (bom ter):

- xAI: `xai/grok-4` (ou o mais recente disponível)
- Mistral: `mistral/`… (escolha um modelo com suporte a ferramentas que você tenha ativado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; tool calling depende do modo da API)

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo com suporte a imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes com visão de Claude/Gemini/OpenAI etc.) para exercitar a sondagem de imagem.

### Agregadores / gateways alternativos

Se você tiver chaves ativadas, também oferecemos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos com suporte a ferramenta+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (autenticação via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz live (se tiver credenciais/configuração):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (cloud/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

Dica: não tente hardcodar “todos os modelos” na documentação. A lista autoritativa é o que `discoverModels(...)` retorna na sua máquina + as chaves disponíveis.

## Credenciais (nunca faça commit)

Os testes live descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes live devem encontrar as mesmas chaves.
- Se um teste live disser “no creds”, depure da mesma forma que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de autenticação por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “profile keys” significa nos testes live)
- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para a home live preparada quando presente, mas não é o armazenamento principal de chaves de perfil)
- Execuções live locais copiam por padrão a configuração ativa, os arquivos `auth-profiles.json` por agente, `credentials/` legados e diretórios suportados de autenticação de CLI externa para uma home de teste temporária; sobrescritas de caminho `agents.*.workspace` / `agentDir` são removidas nessa configuração preparada para que as sondagens fiquem longe do seu workspace real do host.

Se você quiser depender de chaves de ambiente (por exemplo, exportadas no seu `~/.profile`), execute os testes locais após `source ~/.profile` ou use os runners Docker abaixo (eles podem montar `~/.profile` no container).

## Deepgram live (transcrição de áudio)

- Teste: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Ativar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Teste: `src/agents/byteplus.live.test.ts`
- Ativar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Sobrescrita opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Teste: `extensions/comfy/comfy.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos agrupados de imagem, vídeo e `music_generate` do comfy
  - Pula cada capacidade, a menos que `models.providers.comfy.<capability>` esteja configurado
  - Útil após alterar envio de workflow comfy, polling, downloads ou registro de plugin

## Live de geração de imagem

- Teste: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Escopo:
  - Enumera todos os plugins de provedor de geração de imagem registrados
  - Carrega variáveis de ambiente ausentes do provedor a partir do seu shell de login (`~/.profile`) antes de sondar
  - Usa por padrão chaves de API live/env antes de perfis de autenticação armazenados, para que chaves de teste desatualizadas em `auth-profiles.json` não mascarem credenciais reais do shell
  - Pula provedores sem autenticação/perfil/modelo utilizável
  - Executa as variantes padrão de geração de imagem pela capacidade compartilhada de runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provedores agrupados atuais cobertos:
  - `openai`
  - `google`
- Restrição opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfis e ignorar sobrescritas apenas de ambiente

## Live de geração de música

- Teste: `extensions/music-generation-providers.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Escopo:
  - Exercita o caminho compartilhado agrupado de provedor de geração de música
  - Atualmente cobre Google e MiniMax
  - Carrega variáveis de ambiente do provedor a partir do seu shell de login (`~/.profile`) antes de sondar
  - Pula provedores sem autenticação/perfil/modelo utilizável
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`

## Runners Docker (verificações opcionais de "funciona em Linux")

Esses runners Docker se dividem em dois grupos:

- Runners de modelo live: `test:docker:live-models` e `test:docker:live-gateway` executam apenas seu arquivo live correspondente com chaves de perfil dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de config e workspace (e carregando `~/.profile` se estiver montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Os runners Docker live usam por padrão um limite smoke menor para que uma varredura Docker completa permaneça prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescreva essas variáveis de ambiente quando
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` compila a imagem Docker live uma vez via `test:docker:live-build`, depois a reutiliza para as duas lanes Docker live.
- Runners de smoke de container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` iniciam um ou mais containers reais e verificam caminhos de integração de nível superior.

Os runners Docker de modelo live também fazem bind-mount apenas das homes de autenticação CLI necessárias (ou de todas as compatíveis quando a execução não está restrita), depois as copiam para a home do container antes da execução, para que OAuth de CLI externa possa renovar tokens sem modificar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Rede do gateway (dois containers, autenticação WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Ponte de canal MCP (Gateway preparado com seed + ponte stdio + smoke bruto de frame de notificação Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke de instalação + alias `/plugin` + semântica de reinício do bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Os runners Docker de modelo live também fazem bind-mount do checkout atual em modo somente leitura e
o preparam em um workdir temporário dentro do container. Isso mantém a imagem de runtime
enxuta, enquanto ainda executa o Vitest exatamente sobre seu código-fonte/configuração local.
A etapa de preparação ignora grandes caches somente locais e saídas de build de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios locais de saída `.build` ou
Gradle, para que execuções live em Docker não gastem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que sondagens live do gateway não iniciem
workers reais de canal Telegram/Discord/etc. dentro do container.
`test:docker:live-models` ainda executa `pnpm test:live`, então repasse também
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir cobertura
live do gateway dessa lane Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível superior: ele inicia um
container de gateway OpenClaw com endpoints HTTP compatíveis com OpenAI ativados,
inicia um container Open WebUI fixado apontando para esse gateway, faz login pelo
Open WebUI, verifica que `/api/models` expõe `openclaw/default` e então envia uma
solicitação real de chat pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser visivelmente mais lenta, porque o Docker pode precisar baixar a
imagem Open WebUI e o próprio Open WebUI pode precisar concluir sua inicialização a frio.
Essa lane espera uma chave de modelo live utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a forma principal de fornecê-la em execuções Dockerizadas.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicializa um Gateway preparado com seed em um
container, inicia um segundo container que executa `openclaw mcp serve` e então
verifica descoberta de conversa roteada, leitura de transcrição, metadados de anexo,
comportamento da fila de eventos ao vivo, roteamento de envio de saída e notificações de canal +
permissão no estilo Claude pela ponte stdio MCP real. A verificação de notificação
inspeciona diretamente os frames MCP stdio brutos, para que o smoke valide o que a
ponte realmente emite, e não apenas o que um SDK cliente específico por acaso expõe.

Smoke manual de thread ACP em linguagem natural (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de regressão/depuração. Ele pode ser necessário novamente para validação de roteamento de thread ACP, portanto não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar os testes
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações em cache de CLI dentro do Docker
- Diretórios/arquivos de autenticação de CLI externa sob `$HOME` são montados como somente leitura em `/host-auth...`, depois copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções com provedores restritos montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescreva manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do container
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfis (não do ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescrever o prompt de verificação por nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescrever a tag de imagem fixada do Open WebUI

## Sanidade da documentação

Execute verificações da documentação após editar docs: `pnpm check:docs`.
Execute validação completa de âncoras do Mintlify quando também precisar verificar títulos na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Tool calling do gateway (mock OpenAI, gateway real + loop de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do gateway (WS `wizard.start`/`wizard.next`, grava config + auth imposta): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como “avaliações de confiabilidade do agente”:

- Mock de tool-calling pelo gateway real + loop do agente (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente que validam fiação de sessão e efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (consulte [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a Skill correta (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/args obrigatórios?
- **Contratos de fluxo de trabalho:** cenários de múltiplos turnos que afirmam ordem de ferramentas, continuidade do histórico da sessão e limites do sandbox.

Avaliações futuras devem permanecer determinísticas primeiro:

- Um runner de cenários usando provedores mock para afirmar chamadas de ferramenta + ordem, leituras de arquivos de Skill e fiação de sessão.
- Uma pequena suíte de cenários focados em Skills (usar vs evitar, gating, prompt injection).
- Avaliações live opcionais (opt-in, controladas por env) apenas depois que a suíte segura para CI estiver implementada.

## Testes de contrato (forma de plugin e canal)

Os testes de contrato verificam se todo plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram sobre todos os plugins descobertos e executam uma suíte de
afirmações de forma e comportamento. A lane unit padrão `pnpm test` intencionalmente
ignora esses arquivos compartilhados de seam e smoke; execute os comandos de contrato explicitamente
quando alterar superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canal: `pnpm test:contracts:channels`
- Apenas contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica do plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vínculo de sessão
- **outbound-payload** - Estrutura da carga de mensagem
- **inbound** - Tratamento de mensagem de entrada
- **actions** - Manipuladores de ação do canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação de política de grupo

### Contratos de status do provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondagens de status de canal
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

- Após alterar exports ou subpaths do plugin-sdk
- Após adicionar ou modificar um plugin de canal ou provedor
- Após refatorar registro ou descoberta de plugin

Os testes de contrato rodam em CI e não requerem chaves de API reais.

## Adicionando regressões (orientação)

Quando você corrige um problema de provedor/modelo descoberto em live:

- Adicione uma regressão segura para CI, se possível (provedor mock/stub, ou capture a transformação exata da forma da solicitação)
- Se for inerentemente apenas live (limites de taxa, políticas de autenticação), mantenha o teste live restrito e opt-in por variáveis de ambiente
- Prefira direcionar a menor camada que capture o bug:
  - bug de conversão/replay de solicitação do provedor → teste de modelos diretos
  - bug de pipeline de sessão/histórico/ferramenta do gateway → smoke live do gateway ou teste mock do gateway seguro para CI
- Guardrail de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`), então afirma que ids exec de segmento de travessia são rejeitados.
  - Se você adicionar uma nova família de alvo SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.
