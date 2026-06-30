---
read_when:
    - Entendendo como a stack de QA se encaixa
    - Estendendo qa-lab, qa-channel ou um adaptador de transporte
    - Adicionando cenários de QA com respaldo em repositório
    - Criando automação de QA de maior realismo em torno do painel do Gateway
summary: 'Visão geral da pilha de QA: qa-lab, qa-channel, cenários com suporte do repositório, faixas de transporte ao vivo, adaptadores de transporte e relatórios.'
title: Visão geral de QA
x-i18n:
    generated_at: "2026-06-30T13:52:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

A pilha privada de QA foi criada para exercitar o OpenClaw de uma forma mais realista,
moldada por canais, do que um único teste unitário consegue.

Peças atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `extensions/qa-matrix`, futuros plugins executores: adaptadores de transporte ao vivo que
  conduzem um canal real dentro de um Gateway de QA filho.
- `qa/`: ativos semente versionados no repositório para a tarefa inicial e cenários de QA
  de linha de base.
- [Mantis](/pt-BR/concepts/mantis): verificação ao vivo antes e depois para bugs que
  precisam de transportes reais, capturas de tela do navegador, estado de VM e evidências de PR.

## Superfície de comandos

Todo fluxo de QA roda sob `pnpm openclaw qa <subcommand>`. Muitos têm aliases
de script `pnpm qa:*`; ambas as formas são compatíveis.

| Comando                                             | Finalidade                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autoverificação de QA integrada sem `--qa-profile`; executor de perfil de maturidade baseado em taxonomia com `--qa-profile smoke-ci`, `--qa-profile release` ou `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | Executa cenários versionados no repositório contra a rota do Gateway de QA. Aliases: `pnpm openclaw qa suite --runner multipass` para uma VM Linux descartável.                                                                                                                                  |
| `qa coverage`                                       | Imprime o inventário de cobertura de cenários YAML (`--json` para saída de máquina).                                                                                                                                                                                               |
| `qa parity-report`                                  | Compara dois arquivos `qa-suite-summary.json` e grava o relatório de paridade agêntico, ou usa `--runtime-axis --token-efficiency` para gravar relatórios de paridade de runtime Codex-vs-OpenClaw e eficiência de tokens a partir de um resumo de par de runtimes.                                         |
| `qa character-eval`                                 | Executa o cenário de QA de personagem em vários modelos ao vivo com um relatório julgado. Veja [Relatórios](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Executa um prompt avulso contra a rota do provedor/modelo selecionado.                                                                                                                                                                                                          |
| `qa ui`                                             | Inicia a UI de depuração de QA e o barramento local de QA (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Cria a imagem Docker de QA pré-preparada.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Grava um scaffold docker-compose para o painel de QA + rota do Gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Compila o site de QA, inicia a pilha apoiada por Docker e imprime a URL (alias: `pnpm qa:lab:up`; a variante `:fast` adiciona `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Inicia apenas o servidor do provedor AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Inicia apenas o servidor do provedor `mock-openai` ciente de cenários.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Gerencia o pool compartilhado de credenciais Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Rota de transporte ao vivo contra um homeserver Tuwunel descartável. Veja [QA de Matrix](/pt-BR/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Rota de transporte ao vivo contra um grupo privado real do Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Rota de transporte ao vivo contra um canal real de guild privada do Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | Rota de transporte ao vivo contra um canal privado real do Slack.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Rota de transporte ao vivo contra contas reais do WhatsApp Web.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Executor de verificação antes e depois para bugs de transporte ao vivo, com evidência de reações de status no Discord, smoke de desktop/navegador no Crabbox e smoke de Slack-em-VNC. Veja [Mantis](/pt-BR/concepts/mantis) e [Runbook do Mantis Slack Desktop](/pt-BR/concepts/mantis-slack-desktop-runbook). |

`qa run` com suporte a perfil lê a associação em `taxonomy.yaml` e então despacha
os cenários resolvidos por meio de `qa suite`. `--surface` e
`--category` filtram o perfil selecionado em vez de definir rotas separadas.
O `qa-evidence.json` resultante inclui um resumo de scorecard de perfil com
contagens de categorias selecionadas e IDs de cobertura ausentes; as entradas
individuais de evidência permanecem a fonte da verdade para os testes, funções
de cobertura e resultados. IDs de cobertura de recursos da taxonomia são alvos
exatos de prova, não aliases. A cobertura primária de cenário satisfaz IDs
correspondentes; a cobertura secundária permanece consultiva.
IDs de cobertura usam o formato pontilhado `namespace.behavior` com segmentos
alfanuméricos/minúsculos e hífens; IDs de perfil, superfície e categoria ainda podem usar
os IDs de taxonomia existentes com hífen ou ponto.
Evidência enxuta omite `execution` por entrada e define `evidenceMode: "slim"`;
`smoke-ci` usa enxuto por padrão, e `--evidence-mode full` restaura entradas completas:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Use `smoke-ci` para prova determinística de perfil com provedores de modelo mock e
servidores de provedor local Crabline. Use `release` para prova Estável/LTS contra canais
ao vivo. Use `all` apenas para execuções explícitas de evidência de taxonomia completa; ele seleciona
todas as categorias de maturidade ativas e pode ser despachado pelo workflow `QA Profile
Evidence` com `qa_profile=all`. Quando um comando também precisar de um perfil raiz do OpenClaw,
coloque o perfil raiz antes do comando de QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Fluxo do operador

O fluxo atual do operador de QA é um site de QA com dois painéis:

- Esquerda: painel do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição no estilo Slack e o plano do cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso compila o site de QA, inicia a rota do Gateway apoiada por Docker e expõe a
página do QA Lab, onde um operador ou loop de automação pode dar ao agente uma
missão de QA, observar comportamento real de canal e registrar o que funcionou, falhou ou
permaneceu bloqueado.

Para iteração mais rápida da UI do QA Lab sem reconstruir a imagem Docker a cada vez,
inicie a pilha com um pacote do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-compilada e monta por bind
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
recompila esse pacote em mudanças, e o navegador recarrega automaticamente quando o hash
de ativos do QA Lab muda.

Para um smoke local de sinal OpenTelemetry, execute:

```bash
pnpm qa:otel:smoke
```

Esse script inicia um receptor OTLP/HTTP local, executa o cenário de QA `otel-trace-smoke`
com o plugin `diagnostics-otel` habilitado e então verifica se traces,
métricas e logs são exportados. Ele decodifica os spans de trace protobuf exportados
e verifica o formato crítico para release:
`openclaw.run`, `openclaw.harness.run`, um span de chamada de modelo da convenção semântica
GenAI mais recente, `openclaw.context.assembled` e `openclaw.message.delivery`
devem estar presentes. O smoke força
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, então o span de chamada de modelo
deve usar o nome `{gen_ai.operation.name} {gen_ai.request.model}`;
chamadas de modelo não devem exportar `StreamAbandoned` em turnos bem-sucedidos; IDs diagnósticos brutos e
atributos `openclaw.content.*` devem ficar fora do trace. Os payloads OTLP brutos
não devem conter o sentinela de prompt, sentinela de resposta ou chave de sessão de QA.
Ele grava `otel-smoke-summary.json` ao lado dos artefatos da suíte de QA.

Para um smoke OpenTelemetry apoiado por collector, execute:

```bash
pnpm qa:otel:collector-smoke
```

Essa rota coloca um contêiner Docker real do OpenTelemetry Collector na frente do
mesmo receptor local. Use-a ao alterar a fiação de endpoint, compatibilidade com collector
ou comportamento de exportação OTLP que o receptor em processo poderia mascarar.

Para o smoke de scrape Prometheus protegido, execute:

```bash
pnpm qa:prometheus:smoke
```

Esse alias executa o cenário de QA `docker-prometheus-smoke` com
`diagnostics-prometheus` habilitado, verifica que coletas não autenticadas são
rejeitadas e então confere se a coleta autenticada inclui famílias de métricas
críticas para release sem conteúdo de prompt, conteúdo de resposta,
identificadores diagnósticos brutos, tokens de autenticação ou caminhos locais.

Para executar os dois testes de fumaça de observabilidade em sequência, use:

```bash
pnpm qa:observability:smoke
```

Para a faixa OpenTelemetry com coletor e o teste de fumaça de coleta protegida
do Prometheus, use:

```bash
pnpm qa:observability:collector-smoke
```

O QA de observabilidade permanece apenas para checkout de código-fonte. O
tarball npm omite intencionalmente o QA Lab, portanto as faixas Docker de release
de pacote não executam comandos `qa`. Use `pnpm qa:otel:smoke`,
`pnpm qa:prometheus:smoke` ou `pnpm qa:observability:smoke` a partir de um
checkout de código-fonte compilado ao alterar a instrumentação de diagnósticos.

Para uma faixa de teste de fumaça Matrix com transporte real que não exige
credenciais de provedor de modelo, execute o perfil rápido com o provedor OpenAI
mock determinístico:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Para a faixa de provedor live-frontier, forneça explicitamente credenciais
compatíveis com OpenAI:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

A referência completa da CLI, o catálogo de perfis/cenários, as variáveis de ambiente e o layout de artefatos desta faixa ficam em [QA Matrix](/pt-BR/concepts/qa-matrix). Em resumo: ela provisiona um homeserver Tuwunel descartável no Docker, registra usuários temporários de driver/SUT/observador, executa o Plugin Matrix real dentro de um Gateway de QA filho com escopo nesse transporte (sem `qa-channel`) e então grava um relatório Markdown, um resumo JSON, um artefato de eventos observados e um log de saída combinado em `.artifacts/qa-e2e/matrix-<timestamp>/`.

Os cenários cobrem comportamentos de transporte que testes unitários não conseguem provar de ponta a ponta: bloqueio por menção, políticas de permitir bot, allowlists, respostas de nível superior e em threads, roteamento de DM, tratamento de reações, supressão de edições recebidas, desduplicação de replay após reinício, recuperação de interrupção do homeserver, entrega de metadados de aprovação, tratamento de mídia e fluxos de bootstrap/recuperação/verificação de E2EE do Matrix. O perfil CLI de E2EE também executa `openclaw matrix encryption setup` e comandos de verificação pelo mesmo homeserver descartável antes de verificar respostas do Gateway.

Discord também tem cenários opcionais apenas do Mantis para reprodução de bugs. Use
`--scenario discord-status-reactions-tool-only` para a linha do tempo explícita
de reações de status, ou `--scenario discord-thread-reply-filepath-attachment`
para criar uma thread real do Discord e verificar que `message.thread-reply`
preserva um anexo `filePath`. Esses cenários ficam fora da faixa Discord live
padrão porque são sondas de reprodução antes/depois, não cobertura ampla de
teste de fumaça. O fluxo de trabalho Mantis de anexo em thread também pode
adicionar um vídeo de testemunha do Discord Web com login quando
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` ou
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` estiver configurado no ambiente
de QA. Esse perfil de visualizador é apenas para captura visual; a decisão de
aprovação/reprovação ainda vem do oráculo REST do Discord.

A CI usa a mesma superfície de comandos em `.github/workflows/qa-live-transports-convex.yml`.
Execuções agendadas e manuais padrão executam o perfil rápido do Matrix com
credenciais live-frontier fornecidas pelo QA, `--fast` e
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. A opção manual `matrix_profile=all`
distribui a execução nos cinco shards de perfil.

Para faixas de teste de fumaça com transporte real de Telegram, Discord, Slack e WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Elas miram um canal real preexistente com dois bots ou contas (driver + SUT). As variáveis de ambiente obrigatórias, listas de cenários, artefatos de saída e o pool de credenciais Convex estão documentados na [referência de QA para Telegram, Discord, Slack e WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) abaixo.

Para uma execução completa em VM desktop do Slack com resgate por VNC, execute:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Esse comando reserva uma máquina desktop/navegador do Crabbox, executa a faixa
live do Slack dentro da VM, abre o Slack Web no navegador VNC, captura o desktop
e copia `slack-qa/`, `slack-desktop-smoke.png` e `slack-desktop-smoke.mp4`,
quando a captura de vídeo está disponível, de volta para o diretório de
artefatos do Mantis. Reservas desktop/navegador do Crabbox fornecem previamente
as ferramentas de captura e os pacotes auxiliares de navegador/build nativo,
então o cenário só deve instalar fallbacks em reservas mais antigas. O Mantis
relata tempos totais e por fase em `mantis-slack-desktop-smoke-report.md`, para
que execuções lentas mostrem se o tempo foi gasto no aquecimento da reserva, na
aquisição de credenciais, na configuração remota ou na cópia de artefatos.
Reutilize `--lease-id <cbx_...>` depois de entrar manualmente no Slack Web pelo
VNC; reservas reutilizadas também mantêm o cache da store pnpm do Crabbox
aquecido. O padrão `--hydrate-mode source` verifica a partir de um checkout de
código-fonte e executa instalação/build dentro da VM. Use
`--hydrate-mode prehydrated` apenas quando o workspace remoto reutilizado já
tiver `node_modules` e um `dist/` compilado; esse modo pula a etapa cara de
instalação/build e falha de forma fechada quando o workspace não está pronto.
Com `--gateway-setup`, o Mantis deixa um Gateway OpenClaw Slack persistente em
execução dentro da VM na porta `38973`; sem isso, o comando executa a faixa
normal de QA Slack bot-para-bot e sai após a captura de artefatos.

Para provar a UI nativa de aprovação do Slack com evidência de desktop, execute o modo de checkpoint de aprovação do Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Esse modo é mutuamente exclusivo com `--gateway-setup`. Ele executa os cenários
de aprovação do Slack, rejeita ids de cenário que não sejam de aprovação,
aguarda em cada estado de aprovação pendente e resolvido, renderiza a mensagem
observada da API do Slack em `approval-checkpoints/<scenario>-pending.png` e
`approval-checkpoints/<scenario>-resolved.png` e então falha se qualquer
checkpoint, evidência de mensagem, confirmação ou screenshot renderizado estiver
ausente ou vazio. Reservas frias de CI ainda podem mostrar login no Slack em
`slack-desktop-smoke.png`; as imagens de checkpoint de aprovação são a prova
visual desta faixa.

A checklist do operador, o comando de disparo do fluxo de trabalho do GitHub, o
contrato de comentário de evidências, a tabela de decisão de modo de hidratação,
a interpretação de tempos e as etapas de tratamento de falhas ficam em
[Runbook do Mantis Slack Desktop](/pt-BR/concepts/mantis-slack-desktop-runbook).

Para uma tarefa desktop em estilo agente/CV, execute:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` reserva ou reutiliza uma máquina desktop/navegador do Crabbox,
inicia `crabbox record --while`, controla o navegador visível por meio de um
`visual-driver` aninhado, captura `visual-task.png`, executa
`openclaw infer image describe` contra o screenshot quando
`--vision-mode image-describe` está selecionado e grava `visual-task.mp4`,
`mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json` e
`mantis-visual-task-report.md`. Quando `--expect-text` está definido, o prompt
de visão pede um veredito JSON estruturado e só passa quando o modelo relata
evidência visível positiva; uma resposta negativa que apenas cita o texto alvo
falha a asserção. Use `--vision-mode metadata` para um teste de fumaça sem
modelo que prova o encanamento de desktop, navegador, screenshot e vídeo sem
chamar um provedor de entendimento de imagem. A gravação é um artefato
obrigatório para `visual-task`; se o Crabbox não gravar um `visual-task.mp4` não
vazio, a tarefa falha mesmo quando o driver visual passou. Em caso de falha, o
Mantis mantém a reserva para VNC, a menos que a tarefa já tenha passado e
`--keep-lease` não tenha sido definido.

Antes de usar credenciais live agrupadas, execute:

```bash
pnpm openclaw qa credentials doctor
```

O doctor verifica o ambiente do broker Convex, valida as configurações de endpoint e verifica a acessibilidade de admin/lista quando o segredo de mantenedor está presente. Ele relata apenas o status definido/ausente para segredos.

## Cobertura de transporte live

As faixas de transporte live compartilham um contrato em vez de cada uma inventar seu próprio formato de lista de cenários. `qa-channel` é a suíte sintética ampla de comportamento de produto e não faz parte da matriz de cobertura de transporte live.

Runners de transporte live devem importar os ids de cenário compartilhados, os
helpers de cobertura de baseline e o helper de seleção de cenário de
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Faixa    | Canary | Bloqueio por menção | Bot-para-bot | Bloqueio por allowlist | Resposta de nível superior | Resposta com citação | Retomada após reinício | Acompanhamento de thread | Isolamento de thread | Observação de reação | Comando de ajuda | Registro de comando nativo |
| -------- | ------ | ------------------- | ------------ | ---------------------- | -------------------------- | -------------------- | ----------------------- | ------------------------- | -------------------- | -------------------- | ---------------- | -------------------------- |
| Matrix   | x      | x                   | x            | x                      | x                          |                      | x                       | x                         | x                    | x                    |                  |                            |
| Telegram | x      | x                   | x            |                        |                            |                      |                         |                           |                      |                      | x                |                            |
| Discord  | x      | x                   | x            |                        |                            |                      |                         |                           |                      |                      |                  | x                          |
| Slack    | x      | x                   | x            | x                      | x                          |                      | x                       | x                         | x                    |                      |                  |                            |
| WhatsApp | x      | x                   |              | x                      | x                          | x                    | x                       |                           |                      | x                    | x                |                            |

Isso mantém `qa-channel` como a suíte ampla de comportamento de produto enquanto
Matrix, Telegram e outros transportes live compartilham uma checklist explícita
de contrato de transporte.

Para uma faixa em VM Linux descartável sem trazer Docker para o caminho de QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um guest Multipass novo, instala dependências, compila o
OpenClaw dentro do guest, executa `qa suite` e então copia o relatório e o
resumo normais de QA de volta para `.artifacts/qa-e2e/...` no host. Ele reutiliza
o mesmo comportamento de seleção de cenário que `qa suite` no host. Execuções da
suíte no host e no Multipass executam vários cenários selecionados em paralelo
com workers de Gateway isolados por padrão. `qa-channel` usa concorrência 4 por
padrão, limitada pela contagem de cenários selecionados. Use
`--concurrency <count>` para ajustar a contagem de workers, ou `--concurrency 1`
para execução serial. Use `--pack personal-agent` para executar o pacote de
benchmark de assistente pessoal. O seletor de pacote é aditivo com flags
`--scenario` repetidas: cenários explícitos executam primeiro, depois os
cenários do pacote executam na ordem do pacote, com duplicatas removidas. Use
`--pack observability` quando um runner de QA personalizado já fornecer a
configuração do coletor OpenTelemetry e quiser selecionar juntos os cenários de
teste de fumaça de diagnósticos OpenTelemetry e Prometheus. O comando sai com
código diferente de zero quando qualquer cenário falha. Use `--allow-failures`
quando quiser artefatos sem um código de saída de falha. Execuções live
encaminham as entradas de autenticação de QA compatíveis que são práticas para o
guest: chaves de provedor baseadas em env, o caminho de configuração do provedor
live de QA e `CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do
repo para que o guest possa gravar de volta pelo workspace montado.

## Referência de QA para Telegram, Discord, Slack e WhatsApp

O Matrix tem uma [página dedicada](/pt-BR/concepts/qa-matrix) por causa da contagem de cenários e do provisionamento de homeserver com suporte por Docker. Telegram, Discord, Slack e WhatsApp executam contra transportes reais preexistentes, portanto a referência deles fica aqui.

### Flags de CLI compartilhadas

Essas lanes são registradas por meio de `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e aceitam as mesmas flags:

| Flag                                  | Padrão                                             | Descrição                                                                                                                                                       |
| ------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Executa apenas este cenário. Repetível.                                                                                                                         |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Onde relatórios, resumos, evidências, artefatos específicos do transporte e o log de saída são gravados. Caminhos relativos são resolvidos contra `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Raiz do repositório ao invocar a partir de um cwd neutro.                                                                                                       |
| `--sut-account <id>`                  | `sut`                                              | ID de conta temporária dentro da configuração do Gateway de QA.                                                                                                 |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` ou `live-frontier` (o legado `live-openai` ainda funciona).                                                                                       |
| `--model <ref>` / `--alt-model <ref>` | padrão do provedor                                 | Refs de modelo primário/alternativo.                                                                                                                           |
| `--fast`                              | desativado                                         | Modo rápido do provedor, quando compatível.                                                                                                                     |
| `--credential-source <env\|convex>`   | `env`                                              | Consulte o [pool de credenciais Convex](#convex-credential-pool).                                                                                               |
| `--credential-role <maintainer\|ci>`  | `ci` em CI, caso contrário `maintainer`            | Função usada quando `--credential-source convex`.                                                                                                               |

Cada lane sai com código diferente de zero em qualquer cenário com falha. `--allow-failures` grava artefatos sem definir um código de saída com falha.

### QA do Telegram

```bash
pnpm openclaw qa telegram
```

Tem como alvo um grupo privado real do Telegram com dois bots distintos (driver + SUT). O bot SUT deve ter um nome de usuário do Telegram; a observação bot-a-bot funciona melhor quando ambos os bots têm o **Bot-to-Bot Communication Mode** habilitado no `@BotFather`.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - ID numérico do chat (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Cenários (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

O conjunto padrão implícito sempre cobre canary, bloqueio por menção, respostas de comandos nativos, endereçamento de comandos e respostas bot-a-bot em grupo. Os padrões de `mock-openai` também incluem verificações determinísticas de cadeia de respostas e streaming da mensagem final. `telegram-current-session-status-tool` continua opcional porque só é estável quando encadeado diretamente após canary, não após respostas arbitrárias de comandos nativos. Use `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` para imprimir a divisão atual entre padrão/opcional com refs de regressão.

Artefatos de saída:

- `telegram-qa-report.md`
- `qa-evidence.json` - entradas de evidência para as verificações de transporte ao vivo, incluindo campos de perfil, cobertura, provedor, canal, artefatos, resultado e RTT.

Execuções de pacote do Telegram usam o mesmo contrato de credenciais do Telegram. A medição repetida de RTT faz parte da lane live normal do Telegram de pacote; a distribuição de RTT é incorporada em `qa-evidence.json` sob `result.timing` para a verificação de RTT selecionada.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Quando `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` é definido, o wrapper live de pacote aluga uma credencial `kind: "telegram"`, exporta o env do grupo/driver/bot SUT alugado para a execução do pacote instalado, envia Heartbeats da concessão e a libera no desligamento. O wrapper de pacote usa por padrão 20 verificações de RTT de `telegram-mentioned-message-reply`, um tempo limite de RTT de 30s e a função Convex `maintainer` fora de CI quando Convex é selecionado. Sobrescreva `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` ou `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar a medição de RTT sem criar um comando RTT separado ou um formato de resumo específico do Telegram.

### QA do Discord

```bash
pnpm openclaw qa discord
```

Tem como alvo um canal real de guild privado do Discord com dois bots: um bot driver controlado pelo harness e um bot SUT iniciado pelo Gateway filho do OpenClaw por meio do Plugin Discord incluído. Verifica o tratamento de menções no canal, se o bot SUT registrou o comando nativo `/help` com o Discord e cenários de evidência Mantis opcionais.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - deve corresponder ao ID do usuário do bot SUT retornado pelo Discord (caso contrário, a lane falha rapidamente).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mantém corpos de mensagens em artefatos de mensagens observadas.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` seleciona o canal de voz/stage para `discord-voice-autojoin`; sem isso, o cenário escolhe o primeiro canal de voz/stage visível para o bot SUT.

Cenários (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - cenário de voz opcional. Executa sozinho, habilita `channels.discord.voice.autoJoin` e verifica se o estado de voz atual no Discord do bot SUT é o canal de voz/stage alvo. Credenciais Discord da Convex podem incluir `voiceChannelId` opcional; caso contrário, o executor descobre o primeiro canal de voz/stage visível na guild.
- `discord-status-reactions-tool-only` - cenário Mantis opcional. Executa sozinho porque muda o SUT para respostas de guild sempre ativas e somente ferramenta com `messages.statusReactions.enabled=true`, depois captura uma linha do tempo de reações REST mais artefatos visuais HTML/PNG. Relatórios Mantis antes/depois também preservam artefatos MP4 fornecidos pelo cenário como `baseline.mp4` e `candidate.mp4`.

Execute explicitamente o cenário de entrada automática em voz do Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Execute explicitamente o cenário de reações de status do Mantis:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

Artefatos de saída:

- `discord-qa-report.md`
- `qa-evidence.json` - entradas de evidência para as verificações de transporte ao vivo.
- `discord-qa-observed-messages.json` - corpos redigidos, a menos que `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` e `discord-status-reactions-tool-only-timeline.png` quando o cenário de reação de status é executado.

### QA do Slack

```bash
pnpm openclaw qa slack
```

Tem como alvo um canal privado real do Slack com dois bots distintos: um bot driver controlado pelo harness e um bot SUT iniciado pelo Gateway filho do OpenClaw por meio do Plugin Slack incluído.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mantém corpos de mensagens em artefatos de mensagens observadas.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` habilita checkpoints de aprovação visual para o Mantis. O executor grava `<scenario>.pending.json` e `<scenario>.resolved.json`, depois aguarda arquivos `.ack.json` correspondentes.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` sobrescreve o tempo limite de confirmação do checkpoint. O padrão é `120000`.

Cenários (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - cenário opcional de aprovação de exec nativa do Slack. Solicita uma aprovação de exec por meio do Gateway, verifica se a mensagem do Slack tem botões de aprovação nativos, resolve-a e verifica a atualização resolvida do Slack.
- `slack-approval-plugin-native` - cenário opcional de aprovação nativa de Plugin do Slack. Habilita o encaminhamento de aprovações de exec e Plugin em conjunto para que eventos de Plugin não sejam suprimidos pelo roteamento de aprovação de exec, depois verifica o mesmo caminho de UI nativa do Slack pendente/resolvido.

Artefatos de saída:

- `slack-qa-report.md`
- `qa-evidence.json` - entradas de evidência para as verificações de transporte ao vivo.
- `slack-qa-observed-messages.json` - corpos redigidos, a menos que `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - somente quando o Mantis define `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; contém JSON de checkpoint, JSON de confirmação e capturas de tela pendente/resolvido.

#### Configurando o workspace do Slack

A lane precisa de dois apps distintos do Slack em um workspace, além de um canal do qual ambos os bots sejam membros:

- `channelId` - o ID `Cxxxxxxxxxx` de um canal para o qual ambos os bots foram convidados. Use um canal dedicado; a lane publica a cada execução.
- `driverBotToken` - token de bot (`xoxb-...`) do app **Driver**.
- `sutBotToken` - token de bot (`xoxb-...`) do app **SUT**, que deve ser um app Slack separado do driver para que seu ID de usuário de bot seja distinto.
- `sutAppToken` - token em nível de app (`xapp-...`) do app SUT com `connections:write`, usado pelo Socket Mode para que o app SUT possa receber eventos.

Prefira um workspace do Slack dedicado a QA em vez de reutilizar um workspace de produção.

O manifesto SUT abaixo restringe intencionalmente a instalação de produção do Plugin Slack incluído (`extensions/slack/src/setup-shared.ts:10`) às permissões e eventos cobertos pela suíte de QA Slack ao vivo. Para a configuração de canal de produção como os usuários a veem, consulte [configuração rápida do canal Slack](/pt-BR/channels/slack#quick-setup); o par QA Driver/SUT é intencionalmente separado porque a lane precisa de dois IDs de usuário de bot distintos em um workspace.

**1. Crie o app Driver**

Acesse [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → escolha o workspace de QA, cole o manifesto a seguir e depois _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Copie o _Bot User OAuth Token_ (`xoxb-...`), que se torna `driverBotToken`. O driver só precisa postar mensagens e identificar a si mesmo; sem eventos, sem Socket Mode.

**2. Crie o app SUT**

Repita _Create New App → From a manifest_ no mesmo workspace. Este app de QA usa intencionalmente uma versão mais restrita do manifesto de produção do Plugin Slack incluído (`extensions/slack/src/setup-shared.ts:10`): escopos e eventos de reação são omitidos porque a suíte de QA ao vivo do Slack ainda não cobre tratamento de reações.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Depois que o Slack criar o app, faça duas coisas na página de configurações dele:

- _Install to Workspace_ → copie o _Bot User OAuth Token_ → isso se torna `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → adicione o escopo `connections:write` → salve → copie o valor `xapp-...` → isso se torna `sutAppToken`.

Verifique se os dois bots têm IDs de usuário distintos chamando `auth.test` em cada token. O runtime distingue driver e SUT pelo ID de usuário; reutilizar um app para ambos falhará imediatamente no bloqueio por menção.

**3. Crie o canal**

No workspace de QA, crie um canal (por exemplo, `#openclaw-qa`) e convide os dois bots de dentro do canal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copie o ID `Cxxxxxxxxxx` em _channel info → About → Channel ID_; isso se torna `channelId`. Um canal público funciona; se você usar um canal privado, ambos os apps já têm `groups:history`, então as leituras de histórico do harness ainda terão sucesso.

**4. Registre as credenciais**

Duas opções. Use variáveis de ambiente para depuração em uma única máquina (defina as quatro variáveis `OPENCLAW_QA_SLACK_*` e passe `--credential-source env`) ou alimente o pool Convex compartilhado para que a CI e outros mantenedores possam reservá-las.

Para o pool Convex, escreva os quatro campos em um arquivo JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Com `OPENCLAW_QA_CONVEX_SITE_URL` e `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` exportados no seu shell, registre e verifique:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Espere `count: 1`, `status: "active"`, sem campo `lease`.

**5. Verifique de ponta a ponta**

Execute a lane localmente para confirmar que ambos os bots conseguem conversar entre si por meio do broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Uma execução verde termina em bem menos de 30 segundos e `slack-qa-report.md` mostra `slack-canary` e `slack-mention-gating` com status `pass`. Se a lane travar por cerca de 90 segundos e sair com `Convex credential pool exhausted for kind "slack"`, o pool está vazio ou todas as linhas estão reservadas; `qa credentials list --kind slack --status all --json` informará qual é o caso.

### QA do WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Tem como alvo duas contas dedicadas do WhatsApp Web: uma conta de driver controlada pelo harness e uma conta SUT iniciada pelo Gateway filho do OpenClaw por meio do Plugin WhatsApp incluído.

Ambiente obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opcional:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` habilita cenários de grupo, como
  `whatsapp-mention-gating` e `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` mantém corpos de mensagem em
  artefatos de mensagens observadas.

Catálogo de cenários (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Linha de base e bloqueio de grupo: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Comandos nativos: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Comportamento de resposta e saída final: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Mídia de entrada e mensagens estruturadas: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Esses enviam eventos reais de imagem, áudio,
  documento, localização, contato e figurinha do WhatsApp pelo driver.
- Cobertura do Gateway de saída e de ações de mensagem:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Cobertura de controle de acesso: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Aprovações nativas: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reações de status: `whatsapp-status-reactions`.

O catálogo contém atualmente 36 cenários. A lane padrão `live-frontier` é mantida pequena, com 10 cenários, para cobertura rápida de smoke. A lane padrão `mock-openai` executa 31 cenários determinísticos pelo transporte real do WhatsApp enquanto simula apenas a saída do modelo. Cenários de aprovação e algumas verificações mais pesadas/bloqueantes permanecem explícitos por ID de cenário.

O driver de QA do WhatsApp observa eventos vivos estruturados (`text`, `media`, `location`, `reaction` e `poll`) e pode enviar ativamente mídia, enquetes, contatos, localizações e figurinhas. O QA Lab importa esse driver pela superfície de pacote `@openclaw/whatsapp/api.js` em vez de acessar arquivos privados de runtime do WhatsApp. O conteúdo das mensagens é redigido por padrão. A cobertura de enquete de saída e upload de arquivo passa por chamadas determinísticas de Gateway `poll` e `message.action`, em vez de invocação de ferramenta apenas por prompt de modelo.

Artefatos de saída:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - entradas de evidência para as verificações de transporte ao vivo.
- `whatsapp-qa-observed-messages.json` - corpos redigidos, a menos que `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pool de credenciais Convex

As lanes de Telegram, Discord, Slack e WhatsApp podem reservar credenciais de um pool Convex compartilhado em vez de ler as variáveis de ambiente acima. Passe `--credential-source convex` (ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); o QA Lab adquire uma reserva exclusiva, envia heartbeats durante a execução e a libera no desligamento. Os tipos do pool são `"telegram"`, `"discord"`, `"slack"` e `"whatsapp"`.

Formatos de payload que o broker valida em `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` deve ser uma string numérica de ID de chat.
- Usuário real do Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - somente prova do Mantis Telegram Desktop. Lanes genéricas do QA Lab não devem adquirir esse tipo.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - os números de telefone devem ser strings E.164 distintas.

O fluxo de prova do Mantis Telegram Desktop mantém uma reserva Convex exclusiva `telegram-user` tanto para o driver CLI TDLib quanto para a testemunha Telegram Desktop, e depois a libera após publicar a prova.

Quando um PR precisa de um diff visual determinístico, o Mantis pode usar a mesma resposta de modelo simulado em `main` e no head do PR enquanto o formatador ou a camada de entrega do Telegram muda. Os padrões de captura são ajustados para comentários de PR: classe Crabbox padrão, gravação de desktop a 24 fps, GIF de movimento a 24 fps e largura de prévia de 1920 px. Comentários antes/depois devem publicar um pacote limpo que contenha apenas os GIFs pretendidos.

As lanes do Slack também podem usar o pool. As verificações de formato de payload do Slack atualmente ficam no runner de QA do Slack, em vez do broker; use `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, com um ID de canal Slack como `Cxxxxxxxxxx`. Consulte [Configurando o workspace do Slack](#setting-up-the-slack-workspace) para provisionamento de app e escopo.

As variáveis de ambiente operacionais e o contrato de endpoint do broker Convex ficam em [Testing → Credenciais compartilhadas do Telegram via Convex](/pt-BR/help/testing#shared-telegram-credentials-via-convex-v1) (o nome da seção é anterior ao pool multicanal; a semântica de reserva é compartilhada entre os tipos).

## Seeds apoiados pelo repo

Os ativos de seed ficam em `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Eles estão intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto para o agente.

`qa-lab` deve permanecer um runner genérico de cenários YAML. Cada arquivo YAML de cenário é a fonte da verdade para uma execução de teste e deve definir:

- `title` de nível superior
- metadados de `scenario`
- metadados opcionais de categoria, capacidade, lane e risco em `scenario`
- referências de docs e código em `scenario`
- requisitos opcionais de Plugin em `scenario`
- patch opcional de configuração de Gateway em `scenario`
- `flow` executável de nível superior para cenários de fluxo, ou `scenario.execution.kind` /
  `scenario.execution.path` para cenários Vitest e Playwright

A superfície de runtime reutilizável que dá suporte a `flow` pode permanecer genérica
e transversal. Por exemplo, cenários YAML podem combinar auxiliares do lado do
transporte com auxiliares do lado do navegador que conduzem a Control UI embutida por meio da
fronteira `browser.request` do Gateway sem adicionar um runner de caso especial.

Arquivos de cenário devem ser agrupados por capacidade do produto, e não pela pasta
da árvore de código-fonte. Mantenha os IDs de cenário estáveis quando os arquivos se moverem; use `docsRefs` e `codeRefs`
para rastreabilidade da implementação.

A lista de baseline deve permanecer ampla o bastante para cobrir:

- chat por DM e canal
- comportamento de threads
- ciclo de vida de ações de mensagem
- callbacks de cron
- recuperação de memória
- troca de modelo
- transferência para subagente
- leitura de repositório e leitura de docs
- uma pequena tarefa de build, como Lobster Invaders

## Lanes de mock de provedores

`qa suite` tem duas lanes locais de mock de provedor:

- `mock-openai` é o mock do OpenClaw ciente de cenários. Ele continua sendo a lane
  de mock determinística padrão para QA baseado em repositório e gates de paridade.
- `aimock` inicia um servidor de provedor baseado em AIMock para cobertura experimental de protocolo,
  fixture, gravação/reprodução e caos. Ele é aditivo e não
  substitui o dispatcher de cenários `mock-openai`.

A implementação de lanes de provedor vive em `extensions/qa-lab/src/providers/`.
Cada provedor é dono de seus padrões, inicialização do servidor local, configuração de modelo do gateway,
necessidades de staging de perfil de autenticação e flags de capacidade live/mock. Código compartilhado de suíte e
gateway deve rotear pelo registro de provedores em vez de ramificar por
nomes de provedores.

## Adaptadores de transporte

`qa-lab` possui uma fronteira genérica de transporte para cenários de QA em YAML. `qa-channel` é
o padrão sintético. `crabline` inicia servidores locais com formato de provedor e executa
os plugins de canal normais do OpenClaw contra eles. `live` é reservado para credenciais
reais de provedores e canais externos.

No nível de arquitetura, a divisão é:

- `qa-lab` possui a execução genérica de cenários, concorrência de workers, escrita de artefatos e relatórios.
- O adaptador de transporte possui configuração do gateway, prontidão, observação de entrada e saída, ações de transporte e estado de transporte normalizado.
- Arquivos de cenário YAML em `qa/scenarios/` definem a execução de teste; `qa-lab` fornece a superfície de runtime reutilizável que os executa.

### Adicionando um canal

Adicionar um canal ao sistema de QA em YAML exige a implementação do canal mais
um pacote de cenários que exercite o contrato do canal. Para cobertura de smoke em CI, adicione
o servidor de provedor local Crabline correspondente e exponha-o pelo driver `crabline`.

Não adicione uma nova raiz de comando de QA de nível superior quando o host compartilhado `qa-lab` puder possuir o fluxo.

`qa-lab` possui a mecânica compartilhada do host:

- a raiz de comando `openclaw qa`
- inicialização e teardown da suíte
- concorrência de workers
- escrita de artefatos
- geração de relatório
- execução de cenários
- aliases de compatibilidade para cenários `qa-channel` mais antigos

Plugins de runner possuem o contrato de transporte:

- como `openclaw qa <runner>` é montado sob a raiz compartilhada `qa`
- como o gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcrições e estado de transporte normalizado são expostos
- como ações apoiadas por transporte são executadas
- como reset ou limpeza específica do transporte é tratado

O patamar mínimo de adoção para um novo canal:

1. Mantenha `qa-lab` como dono da raiz compartilhada `qa`.
2. Implemente o runner de transporte na fronteira de host compartilhada de `qa-lab`.
3. Mantenha a mecânica específica de transporte dentro do plugin de runner ou harness de canal.
4. Monte o runner como `openclaw qa <runner>` em vez de registrar um comando raiz concorrente. Plugins de runner devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array `qaRunnerCliRegistrations` correspondente de `runtime-api.ts`. Mantenha `runtime-api.ts` leve; CLI lazy e execução do runner devem ficar atrás de entrypoints separados.
5. Escreva ou adapte cenários YAML nos diretórios temáticos `qa/scenarios/`.
6. Use os auxiliares genéricos de cenário para novos cenários.
7. Mantenha os aliases de compatibilidade existentes funcionando, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é estrita:

- Se o comportamento puder ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se o comportamento depender de um transporte de canal, mantenha-o nesse plugin de runner ou harness de plugin.
- Se um cenário precisar de uma nova capacidade que mais de um canal possa usar, adicione um auxiliar genérico em vez de uma ramificação específica de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico de transporte e explicite isso no contrato do cenário.

### Nomes de auxiliares de cenário

Auxiliares genéricos preferidos para novos cenários:

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

Aliases de compatibilidade continuam disponíveis para cenários existentes - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - mas a autoria de novos cenários deve usar os nomes genéricos. Os aliases existem para evitar uma migração em data única, não como o modelo daqui em diante.

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada do barramento.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento vale a pena adicionar

Para o inventário de cenários disponíveis - útil ao dimensionar trabalho de acompanhamento ou conectar um novo transporte - execute `pnpm openclaw qa coverage` (adicione `--json` para saída legível por máquina).
Ao escolher prova focada para um comportamento ou caminho de arquivo tocado, execute `pnpm openclaw qa coverage --match <query>`.
O relatório de correspondência pesquisa metadados de cenário, refs de docs, refs de código, IDs de cobertura, plugins e requisitos de provedor, e então imprime alvos `qa suite --scenario ...` correspondentes.
Toda execução de `qa suite` grava artefatos de nível superior `qa-evidence.json`,
`qa-suite-summary.json` e `qa-suite-report.md` para o conjunto de
cenários selecionado. Cenários que declaram `execution.kind: vitest` ou
`execution.kind: playwright` executam o caminho de teste correspondente e também gravam
logs por cenário. Cenários que declaram `execution.kind: script` executam o
produtor de evidências em `execution.path` por meio de `node --import tsx` (com
`${outputDir}` e `${scenarioId}` expandidos em `execution.args`); o produtor
grava seu próprio `qa-evidence.json`, cujas entradas são importadas para a saída
da suíte e cujos caminhos de artefato são resolvidos em relação ao
`qa-evidence.json` desse produtor. Quando `qa suite` é alcançado por meio de
`qa run --qa-profile`, o mesmo `qa-evidence.json` também inclui o resumo do
scorecard de perfil para as categorias de taxonomia selecionadas.
Trate-o como um auxílio de descoberta, não como substituto de gate; o cenário selecionado ainda precisa do modo de provedor, transporte live, Multipass, Testbox ou lane de release correto para o comportamento em teste.
Para contexto de scorecard, veja [Scorecard de maturidade](/pt-BR/maturity/scorecard).

Para verificações de caráter e estilo, execute o mesmo cenário em várias refs live de modelo
e escreva um relatório julgado em Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

O comando executa processos filhos locais do gateway de QA, não Docker. Cenários de character eval
devem definir a persona por meio de `SOUL.md` e então executar turnos comuns de usuário,
como chat, ajuda no workspace e pequenas tarefas de arquivo. O modelo candidato não deve
ser informado de que está sendo avaliado. O comando preserva cada transcrição completa,
registra estatísticas básicas da execução e então pede aos modelos juízes em modo rápido com
raciocínio `xhigh`, quando compatível, que classifiquem as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar provedores: o prompt do juiz ainda recebe
todas as transcrições e status de execução, mas as refs candidatas são substituídas por
rótulos neutros como `candidate-01`; o relatório mapeia as classificações de volta para as refs reais após
o parsing.
Execuções candidatas usam `high` thinking por padrão, com `medium` para GPT-5.5 e `xhigh`
para refs de eval mais antigas da OpenAI que oferecem suporte. Sobrescreva um candidato específico inline com
`--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um
fallback global, e a forma mais antiga `--model-thinking <provider/model=level>` é
mantida para compatibilidade.
Refs candidatas da OpenAI usam modo rápido por padrão, de modo que o processamento prioritário seja usado quando
o provedor oferecer suporte. Adicione `,fast`, `,no-fast` ou `,fast=false` inline quando um
único candidato ou juiz precisar de uma sobrescrita. Passe `--fast` somente quando quiser
forçar o modo rápido para todos os modelos candidatos. Durações de candidatos e juízes são
registradas no relatório para análise de benchmark, mas os prompts dos juízes dizem explicitamente
para não classificar por velocidade.
Execuções de modelos candidatos e juízes usam concorrência 16 por padrão. Reduza
`--concurrency` ou `--judge-concurrency` quando limites do provedor ou pressão do gateway local
tornarem uma execução ruidosa demais.
Quando nenhum `--model` candidato é passado, o character eval usa por padrão
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando nenhum `--model` é passado.
Quando nenhum `--judge-model` é passado, os juízes usam por padrão
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-8,thinking=high`.

## Docs relacionadas

- [Matriz de QA](/pt-BR/concepts/qa-matrix)
- [Scorecard de maturidade](/pt-BR/maturity/scorecard)
- [Pacote de benchmark de agente pessoal](/pt-BR/concepts/personal-agent-benchmark-pack)
- [Canal de QA](/pt-BR/channels/qa-channel)
- [Testes](/pt-BR/help/testing)
- [Painel](/pt-BR/web/dashboard)
