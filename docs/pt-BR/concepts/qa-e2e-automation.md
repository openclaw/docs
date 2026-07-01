---
read_when:
    - Entendendo como a pilha de QA se encaixa
    - Estendendo qa-lab, qa-channel ou um adaptador de transporte
    - Adicionando cenários de QA baseados em repositório
    - Criando automação de QA de maior realismo em torno do painel do Gateway
summary: 'Visão geral da pilha de QA: qa-lab, qa-channel, cenários respaldados pelo repositório, faixas de transporte ao vivo, adaptadores de transporte e geração de relatórios.'
title: Visão geral de QA
x-i18n:
    generated_at: "2026-07-01T05:32:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
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
- `extensions/qa-matrix`, futuros plugins de execução: adaptadores de transporte ao vivo que
  conduzem um canal real dentro de um Gateway de QA filho.
- `qa/`: ativos seed mantidos no repo para a tarefa inicial e cenários de QA
  de linha de base.
- [Mantis](/pt-BR/concepts/mantis): verificação ao vivo antes e depois para bugs que
  precisam de transportes reais, capturas de tela do navegador, estado de VM e evidência de PR.

## Superfície de comandos

Todo fluxo de QA é executado sob `pnpm openclaw qa <subcommand>`. Muitos têm aliases de script `pnpm qa:*`;
ambas as formas são compatíveis.

| Comando                                             | Finalidade                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autoverificação de QA empacotada sem `--qa-profile`; executor de perfil de maturidade baseado em taxonomia com `--qa-profile smoke-ci`, `--qa-profile release` ou `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | Executar cenários mantidos no repo contra a via do Gateway de QA. Aliases: `pnpm openclaw qa suite --runner multipass` para uma VM Linux descartável.                                                                                                                                  |
| `qa coverage`                                       | Imprimir o inventário YAML de cobertura de cenários (`--json` para saída de máquina).                                                                                                                                                                                               |
| `qa parity-report`                                  | Comparar dois arquivos `qa-suite-summary.json` e gravar o relatório de paridade agêntica, ou usar `--runtime-axis --token-efficiency` para gravar relatórios de paridade de runtime Codex-vs-OpenClaw e eficiência de tokens a partir de um resumo de par de runtimes.                                         |
| `qa character-eval`                                 | Executar o cenário de QA de personagem em vários modelos ao vivo com um relatório julgado. Consulte [Relatórios](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Executar um prompt avulso contra a via de provedor/modelo selecionada.                                                                                                                                                                                                          |
| `qa ui`                                             | Iniciar a UI de depuração de QA e o barramento de QA local (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Criar a imagem Docker de QA pré-preparada.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Gravar um scaffold docker-compose para o painel de QA + via do Gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Criar o site de QA, iniciar a pilha baseada em Docker, imprimir a URL (alias: `pnpm qa:lab:up`; a variante `:fast` adiciona `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Iniciar apenas o servidor provedor AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Iniciar apenas o servidor provedor `mock-openai` ciente de cenários.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Gerenciar o pool compartilhado de credenciais Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Via de transporte ao vivo contra um homeserver Tuwunel descartável. Consulte [QA Matrix](/pt-BR/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Via de transporte ao vivo contra um grupo privado real do Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Via de transporte ao vivo contra um canal real de guilda privada do Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | Via de transporte ao vivo contra um canal privado real do Slack.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Via de transporte ao vivo contra contas reais do WhatsApp Web.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Executor de verificação antes e depois para bugs de transporte ao vivo, com evidência de reações de status do Discord, teste de fumaça de desktop/navegador do Crabbox e teste de fumaça do Slack em VNC. Consulte [Mantis](/pt-BR/concepts/mantis) e [Runbook do Mantis Slack Desktop](/pt-BR/concepts/mantis-slack-desktop-runbook). |

`qa run` baseado em perfil lê a associação de `taxonomy.yaml` e então despacha
os cenários resolvidos por meio de `qa suite`. `--surface` e
`--category` filtram o perfil selecionado em vez de definir vias separadas.
O `qa-evidence.json` resultante inclui um resumo de scorecard do perfil com
contagens por categoria selecionada e IDs de cobertura ausentes; as entradas
individuais de evidência continuam sendo a fonte da verdade para os testes,
funções de cobertura e resultados. IDs de cobertura de recursos da taxonomia são
alvos exatos de prova, não aliases. A cobertura primária de cenário satisfaz IDs
correspondentes; a cobertura secundária permanece consultiva.
IDs de cobertura usam a forma pontuada `namespace.behavior` com segmentos
alfanuméricos/de hífen em minúsculas; IDs de perfil, superfície e categoria ainda podem usar
os IDs de taxonomia existentes com hífen ou pontuação.
Evidência enxuta omite `execution` por entrada e define `evidenceMode: "slim"`;
`smoke-ci` usa enxuta por padrão, e `--evidence-mode full` restaura entradas completas:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Use `smoke-ci` para prova determinística de perfil com provedores de modelo mock e
servidores provedores locais Crabline. Use `release` para prova Stable/LTS contra canais
ao vivo. Use `all` apenas para execuções explícitas de evidência de taxonomia completa; ele seleciona
todas as categorias de maturidade ativas e pode ser despachado pelo workflow `QA Profile
Evidence` com `qa_profile=all`. Quando um comando também precisa de um perfil raiz do OpenClaw,
coloque o perfil raiz antes do comando de QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Fluxo do operador

O fluxo atual de operador de QA é um site de QA com dois painéis:

- Esquerda: painel do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição em estilo Slack e o plano de cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso cria o site de QA, inicia a via de Gateway baseada em Docker e expõe a
página do QA Lab onde um operador ou loop de automação pode dar ao agente uma missão de QA,
observar o comportamento real do canal e registrar o que funcionou, falhou ou
permaneceu bloqueado.

Para iteração mais rápida da UI do QA Lab sem reconstruir a imagem Docker a cada vez,
inicie a pilha com um bundle do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-criada e monta por bind
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
recria esse bundle quando há mudanças, e o navegador recarrega automaticamente quando o hash de ativos do QA Lab
muda.

Para um teste de fumaça de sinal local do OpenTelemetry, execute:

```bash
pnpm qa:otel:smoke
```

Esse script inicia um receptor OTLP/HTTP local, executa o cenário de QA `otel-trace-smoke`
com o plugin `diagnostics-otel` habilitado e então verifica se traces,
métricas e logs são exportados. Ele decodifica os spans de trace protobuf exportados
e verifica a forma crítica para o lançamento:
`openclaw.run`, `openclaw.harness.run`, um span de chamada de modelo da convenção semântica
GenAI mais recente, `openclaw.context.assembled` e `openclaw.message.delivery`
devem estar presentes. O teste de fumaça força
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, então o span de chamada de modelo
deve usar o nome `{gen_ai.operation.name} {gen_ai.request.model}`;
chamadas de modelo não devem exportar `StreamAbandoned` em turnos bem-sucedidos; IDs diagnósticos brutos e
atributos `openclaw.content.*` devem ficar fora do trace. Os payloads OTLP brutos
não devem conter o sentinela de prompt, sentinela de resposta ou chave de sessão de QA.
Ele grava `otel-smoke-summary.json` ao lado dos artefatos da suíte de QA.

Para um teste de fumaça do OpenTelemetry com collector, execute:

```bash
pnpm qa:otel:collector-smoke
```

Essa via coloca um contêiner Docker real do OpenTelemetry Collector na frente do
mesmo receptor local. Use-a ao alterar a fiação de endpoints, compatibilidade com collector
ou comportamento de exportação OTLP que o receptor em processo poderia mascarar.

Para o teste de fumaça protegido de scrape do Prometheus, execute:

```bash
pnpm qa:prometheus:smoke
```

Esse alias executa o cenário de QA `docker-prometheus-smoke` com
`diagnostics-prometheus` habilitado, verifica que scrapes não autenticados são
rejeitados e então confere se o scrape autenticado inclui famílias de métricas
críticas para a versão sem conteúdo de prompt, conteúdo de resposta,
identificadores brutos de diagnóstico, tokens de autenticação ou caminhos
locais.

Para executar ambos os smoke tests de observabilidade em sequência, use:

```bash
pnpm qa:observability:smoke
```

Para a faixa OpenTelemetry com coletor mais o smoke test de scrape Prometheus
protegido, use:

```bash
pnpm qa:observability:collector-smoke
```

O QA de observabilidade permanece apenas para checkout de origem. O tarball npm
omite intencionalmente o QA Lab, portanto as faixas de lançamento Docker de
pacote não executam comandos `qa`. Use `pnpm qa:otel:smoke`,
`pnpm qa:prometheus:smoke` ou `pnpm qa:observability:smoke` a partir de um
checkout de origem compilado ao alterar a instrumentação de diagnósticos.

Para uma faixa de smoke Matrix com transporte real que não exige credenciais de
provedor de modelo, execute o perfil rápido com o provedor mock OpenAI
determinístico:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Para a faixa de provedor live-frontier, forneça credenciais compatíveis com
OpenAI explicitamente:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

A referência completa da CLI, o catálogo de perfis/cenários, as variáveis de ambiente e o layout de artefatos dessa faixa ficam em [QA do Matrix](/pt-BR/concepts/qa-matrix). Em resumo: ela provisiona um homeserver Tuwunel descartável no Docker, registra usuários temporários de driver/SUT/observador, executa o Plugin Matrix real dentro de um Gateway QA filho limitado a esse transporte (sem `qa-channel`) e então grava um relatório Markdown, um resumo JSON, um artefato de eventos observados e um log de saída combinado em `.artifacts/qa-e2e/matrix-<timestamp>/`.

Os cenários cobrem comportamento de transporte que testes unitários não conseguem provar de ponta a ponta: bloqueio por menção, políticas allow-bot, listas de permissões, respostas de nível superior e em threads, roteamento de DM, tratamento de reações, supressão de edições de entrada, desduplicação de replay após reinicialização, recuperação de interrupção do homeserver, entrega de metadados de aprovação, tratamento de mídia e fluxos de bootstrap/recuperação/verificação de E2EE do Matrix. O perfil CLI de E2EE também conduz `openclaw matrix encryption setup` e comandos de verificação pelo mesmo homeserver descartável antes de verificar as respostas do Gateway.

Discord também tem cenários opcionais somente para Mantis para reprodução de bugs. Use
`--scenario discord-status-reactions-tool-only` para a linha do tempo explícita
de reações de status, ou `--scenario discord-thread-reply-filepath-attachment`
para criar uma thread real do Discord e verificar que `message.thread-reply`
preserva um anexo `filePath`. Esses cenários ficam fora da faixa Discord live
padrão porque são sondas de reprodução antes/depois, e não cobertura ampla de
smoke. O fluxo de trabalho Mantis de anexo em thread também pode adicionar um
vídeo testemunha do Discord Web com login quando
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` ou
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` estiver configurado no ambiente
de QA. Esse perfil de visualizador serve apenas para captura visual; a decisão
de aprovado/reprovado ainda vem do oráculo REST do Discord.

A CI usa a mesma superfície de comando em `.github/workflows/qa-live-transports-convex.yml`.
Execuções agendadas e manuais padrão executam o perfil rápido do Matrix com
credenciais live-frontier fornecidas pelo QA, `--fast` e
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. O `matrix_profile=all` manual
distribui a execução nos cinco shards de perfil.

Para faixas de smoke com transporte real de Telegram, Discord, Slack e WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Elas miram um canal real preexistente com dois bots ou contas (driver + SUT). Variáveis de ambiente obrigatórias, listas de cenários, artefatos de saída e o pool de credenciais Convex estão documentados na [referência de QA para Telegram, Discord, Slack e WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) abaixo.

Para uma execução completa em VM desktop do Slack com resgate por VNC, execute:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Esse comando aluga uma máquina Crabbox desktop/navegador, executa a faixa live
do Slack dentro da VM, abre o Slack Web no navegador VNC, captura o desktop e
copia `slack-qa/`, `slack-desktop-smoke.png` e `slack-desktop-smoke.mp4`
quando a captura de vídeo estiver disponível de volta para o diretório de
artefatos do Mantis. Aluguéis desktop/navegador do Crabbox fornecem de antemão
as ferramentas de captura e pacotes auxiliares de navegador/compilação nativa,
portanto o cenário só deve instalar fallbacks em aluguéis mais antigos. O
Mantis relata tempos totais e por fase em `mantis-slack-desktop-smoke-report.md`
para que execuções lentas mostrem se o tempo foi para aquecimento do aluguel,
aquisição de credenciais, configuração remota ou cópia de artefatos. Reutilize
`--lease-id <cbx_...>` depois de fazer login no Slack Web manualmente pelo VNC;
aluguéis reutilizados também mantêm aquecido o cache da store pnpm do Crabbox.
O padrão `--hydrate-mode source` verifica a partir de um checkout de origem e
executa instalação/compilação dentro da VM. Use `--hydrate-mode prehydrated`
somente quando o workspace remoto reutilizado já tiver `node_modules` e um
`dist/` compilado; esse modo pula a etapa cara de instalação/compilação e falha
fechado quando o workspace não está pronto. Com `--gateway-setup`, o Mantis
deixa um Gateway Slack persistente do OpenClaw em execução dentro da VM na porta
`38973`; sem isso, o comando executa a faixa normal de QA Slack bot-para-bot e
sai após a captura de artefatos.

Para provar a UI nativa de aprovação do Slack com evidência de desktop, execute
o modo de checkpoint de aprovação do Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Esse modo é mutuamente exclusivo com `--gateway-setup`. Ele executa os cenários
de aprovação do Slack, rejeita ids de cenário que não sejam de aprovação,
aguarda em cada estado de aprovação pendente e resolvida, renderiza a mensagem
observada da API do Slack em `approval-checkpoints/<scenario>-pending.png` e
`approval-checkpoints/<scenario>-resolved.png` e então falha se qualquer
checkpoint, evidência de mensagem, confirmação ou screenshot renderizado estiver
ausente ou vazio. Aluguéis frios de CI ainda podem mostrar o login do Slack em
`slack-desktop-smoke.png`; as imagens de checkpoint de aprovação são a prova
visual desta faixa.

A checklist do operador, o comando de dispatch do fluxo de trabalho do GitHub, o
contrato de comentário de evidência, a tabela de decisão de modo de hidratação,
a interpretação de tempos e as etapas de tratamento de falhas ficam no
[Runbook de Desktop Slack do Mantis](/pt-BR/concepts/mantis-slack-desktop-runbook).

Para uma tarefa desktop em estilo agente/CV, execute:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` aluga ou reutiliza uma máquina Crabbox desktop/navegador, inicia
`crabbox record --while`, conduz o navegador visível por meio de um
`visual-driver` aninhado, captura `visual-task.png`, executa
`openclaw infer image describe` contra o screenshot quando
`--vision-mode image-describe` está selecionado e grava `visual-task.mp4`,
`mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json` e
`mantis-visual-task-report.md`. Quando `--expect-text` está definido, o prompt
de visão pede um veredito JSON estruturado e só aprova quando o modelo relata
evidência visível positiva; uma resposta negativa que apenas cita o texto-alvo
falha a asserção. Use `--vision-mode metadata` para um smoke sem modelo que
prova o encanamento de desktop, navegador, screenshot e vídeo sem chamar um
provedor de compreensão de imagem. A gravação é um artefato obrigatório para
`visual-task`; se o Crabbox não gravar um `visual-task.mp4` não vazio, a tarefa
falha mesmo quando o driver visual aprovou. Em caso de falha, o Mantis mantém o
aluguel para VNC, a menos que a tarefa já tenha sido aprovada e `--keep-lease`
não tenha sido definido.

Antes de usar credenciais live em pool, execute:

```bash
pnpm openclaw qa credentials doctor
```

O doctor verifica o ambiente do broker Convex, valida configurações de endpoint e verifica a acessibilidade de admin/list quando o segredo de maintainer está presente. Ele relata apenas o status definido/ausente para segredos.

## Cobertura de transporte live

Faixas de transporte live compartilham um contrato em vez de cada uma inventar seu próprio formato de lista de cenários. `qa-channel` é a suíte ampla de comportamento sintético do produto e não faz parte da matriz de cobertura de transporte live.

Runners de transporte live devem importar os ids de cenário compartilhados, os
auxiliares de cobertura de baseline e o auxiliar de seleção de cenário de
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Faixa    | Canário | Bloqueio por menção | Bot para bot | Bloqueio por lista de permissões | Resposta de nível superior | Resposta com citação | Retomada após reinício | Acompanhamento em thread | Isolamento de thread | Observação de reação | Comando de ajuda | Registro de comando nativo |
| -------- | ------- | ------------------- | ------------ | -------------------------------- | -------------------------- | -------------------- | ---------------------- | ------------------------- | -------------------- | -------------------- | ---------------- | -------------------------- |
| Matrix   | x       | x                   | x            | x                                | x                          |                      | x                      | x                         | x                    | x                    |                  |                            |
| Telegram | x       | x                   | x            |                                  |                            |                      |                        |                           |                      |                      | x                |                            |
| Discord  | x       | x                   | x            |                                  |                            |                      |                        |                           |                      |                      |                  | x                          |
| Slack    | x       | x                   | x            | x                                | x                          |                      | x                      | x                         | x                    |                      |                  |                            |
| WhatsApp | x       | x                   |              | x                                | x                          | x                    | x                      |                           |                      | x                    | x                |                            |

Isso mantém `qa-channel` como a suíte ampla de comportamento do produto, enquanto
Matrix, Telegram e outros transportes live compartilham uma checklist explícita
de contrato de transporte.

Para uma faixa de VM Linux descartável sem trazer Docker para o caminho de QA,
execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um guest Multipass novo, instala dependências, compila o
OpenClaw dentro do guest, executa `qa suite` e então copia o relatório e o
resumo normais de QA de volta para `.artifacts/qa-e2e/...` no host.
Ela reutiliza o mesmo comportamento de seleção de cenários que `qa suite` no host.
Execuções da suíte no host e no Multipass executam vários cenários selecionados
em paralelo com workers de Gateway isolados por padrão. `qa-channel` usa
concorrência 4 por padrão, limitada pela contagem de cenários selecionados. Use
`--concurrency <count>` para ajustar a contagem de workers, ou `--concurrency 1`
para execução serial. Use `--pack personal-agent` para executar o pacote de
benchmark de assistente pessoal. O seletor de pacote é aditivo com flags
`--scenario` repetidas: cenários explícitos rodam primeiro, depois os cenários
do pacote rodam na ordem do pacote com duplicatas removidas. Use
`--pack observability` quando um runner de QA personalizado já fornece a
configuração do coletor OpenTelemetry e quer selecionar juntos os cenários de
smoke de diagnósticos OpenTelemetry e Prometheus. O comando sai com código
diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
você quiser artefatos sem um código de saída de falha. Execuções live encaminham
as entradas de autenticação de QA compatíveis que são práticas para o guest:
chaves de provedor baseadas em ambiente, o caminho de configuração do provedor
live de QA e `CODEX_HOME` quando presente. Mantenha `--output-dir` sob a raiz do
repositório para que o guest consiga gravar de volta pelo workspace montado.

## Referência de QA para Telegram, Discord, Slack e WhatsApp

Matrix tem uma [página dedicada](/pt-BR/concepts/qa-matrix) por causa da contagem de cenários e do provisionamento de homeserver com suporte a Docker. Telegram, Discord, Slack e WhatsApp são executados contra transportes reais preexistentes, portanto sua referência fica aqui.

### Flags compartilhadas da CLI

Essas lanes são registradas por meio de `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e aceitam as mesmas flags:

| Flag                                  | Padrão                                            | Descrição                                                                                                                                          |
| ------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                 | Executa apenas este cenário. Repetível.                                                                                                            |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Onde relatórios, resumos, evidências, artefatos específicos do transporte e o log de saída são gravados. Caminhos relativos são resolvidos em relação a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                   | Raiz do repositório ao invocar a partir de um cwd neutro.                                                                                          |
| `--sut-account <id>`                  | `sut`                                             | ID de conta temporário dentro da configuração do Gateway de QA.                                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                   | `mock-openai` ou `live-frontier` (`live-openai` legado ainda funciona).                                                                            |
| `--model <ref>` / `--alt-model <ref>` | padrão do provedor                                | Refs de modelo primário/alternativo.                                                                                                               |
| `--fast`                              | desativado                                        | Modo rápido do provedor quando suportado.                                                                                                          |
| `--credential-source <env\|convex>`   | `env`                                             | Consulte [pool de credenciais Convex](#convex-credential-pool).                                                                                    |
| `--credential-role <maintainer\|ci>`  | `ci` em CI, caso contrário `maintainer`           | Função usada quando `--credential-source convex`.                                                                                                  |

Cada lane sai com valor diferente de zero em qualquer cenário com falha. `--allow-failures` grava artefatos sem definir um código de saída de falha.

### QA do Telegram

```bash
pnpm openclaw qa telegram
```

Tem como alvo um grupo privado real do Telegram com dois bots distintos (driver + SUT). O bot SUT deve ter um nome de usuário do Telegram; a observação bot-a-bot funciona melhor quando ambos os bots têm **Bot-to-Bot Communication Mode** habilitado em `@BotFather`.

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

O conjunto padrão implícito sempre cobre canário, controle por menção, respostas de comandos nativos, endereçamento de comandos e respostas de grupo bot-a-bot. Os padrões de `mock-openai` também incluem verificações determinísticas de cadeia de respostas e streaming de mensagem final. `telegram-current-session-status-tool` continua opt-in porque só é estável quando encadeado diretamente após o canário, não após respostas arbitrárias de comandos nativos. Use `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` para imprimir a divisão atual entre padrão/opcional com refs de regressão.

Artefatos de saída:

- `telegram-qa-report.md`
- `qa-evidence.json` - entradas de evidência para as verificações de transporte ao vivo, incluindo campos de perfil, cobertura, provedor, canal, artefatos, resultado e RTT.

Execuções de pacote do Telegram usam o mesmo contrato de credenciais do Telegram. A medição repetida de RTT faz parte da lane ao vivo normal de pacote do Telegram; a distribuição de RTT é incorporada em `qa-evidence.json` sob `result.timing` para a verificação de RTT selecionada.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Quando `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` é definido, o wrapper ao vivo do pacote aluga uma credencial `kind: "telegram"`, exporta o grupo/driver/bot SUT alugados para o ambiente da execução do pacote instalado, envia Heartbeats para a concessão e a libera no encerramento. O wrapper de pacote usa por padrão 20 verificações de RTT de `telegram-mentioned-message-reply`, um timeout de RTT de 30s e a função Convex `maintainer` fora de CI quando Convex é selecionado. Sobrescreva `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` ou `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar a medição de RTT sem criar um comando RTT separado ou formato de resumo específico do Telegram.

### QA do Discord

```bash
pnpm openclaw qa discord
```

Tem como alvo um canal de guilda privado real do Discord com dois bots: um bot driver controlado pelo harness e um bot SUT iniciado pelo Gateway filho do OpenClaw por meio do Plugin Discord empacotado. Verifica o tratamento de menções no canal, se o bot SUT registrou o comando nativo `/help` no Discord e cenários de evidência Mantis opt-in.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - deve corresponder ao ID de usuário do bot SUT retornado pelo Discord (caso contrário, a lane falha rapidamente).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mantém os corpos das mensagens nos artefatos de mensagens observadas.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` seleciona o canal de voz/palco para `discord-voice-autojoin`; sem isso, o cenário escolhe o primeiro canal de voz/palco visível para o bot SUT.

Cenários (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - cenário de voz opt-in. Executa sozinho, habilita `channels.discord.voice.autoJoin` e verifica se o estado de voz atual no Discord do bot SUT é o canal de voz/palco alvo. As credenciais Discord do Convex podem incluir `voiceChannelId` opcional; caso contrário, o executor descobre o primeiro canal de voz/palco visível na guilda.
- `discord-status-reactions-tool-only` - cenário Mantis opt-in. Executa sozinho porque alterna o SUT para respostas de guilda sempre ativas e somente por ferramenta com `messages.statusReactions.enabled=true`, depois captura uma linha do tempo de reações REST mais artefatos visuais HTML/PNG. Relatórios antes/depois do Mantis também preservam artefatos MP4 fornecidos pelo cenário como `baseline.mp4` e `candidate.mp4`.

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

Tem como alvo um canal privado real do Slack com dois bots distintos: um bot driver controlado pelo harness e um bot SUT iniciado pelo Gateway filho do OpenClaw por meio do Plugin Slack empacotado.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mantém os corpos das mensagens nos artefatos de mensagens observadas.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` habilita checkpoints de aprovação visual para o Mantis. O executor grava `<scenario>.pending.json` e `<scenario>.resolved.json`, depois espera por arquivos `.ack.json` correspondentes.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` substitui o timeout de confirmação do checkpoint. O padrão é `120000`.

Cenários (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - cenário opt-in de aprovação de exec nativa do Slack. Solicita uma aprovação de exec por meio do Gateway, verifica se a mensagem do Slack tem botões de aprovação nativos, resolve-a e verifica a atualização resolvida do Slack.
- `slack-approval-plugin-native` - cenário opt-in de aprovação nativa de Plugin do Slack. Habilita o encaminhamento de aprovação de exec e Plugin em conjunto para que eventos de Plugin não sejam suprimidos pelo roteamento de aprovação de exec, depois verifica o mesmo caminho de IU nativa do Slack pendente/resolvido.

Artefatos de saída:

- `slack-qa-report.md`
- `qa-evidence.json` - entradas de evidência para as verificações de transporte ao vivo.
- `slack-qa-observed-messages.json` - corpos redigidos, a menos que `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - somente quando o Mantis define `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; contém JSON de checkpoint, JSON de confirmação e capturas de tela pendente/resolvida.

#### Configurando o workspace do Slack

A lane precisa de dois apps Slack distintos em um workspace, além de um canal do qual ambos os bots sejam membros:

- `channelId` - o ID `Cxxxxxxxxxx` de um canal para o qual ambos os bots foram convidados. Use um canal dedicado; a lane publica a cada execução.
- `driverBotToken` - token de bot (`xoxb-...`) do app **Driver**.
- `sutBotToken` - token de bot (`xoxb-...`) do app **SUT**, que deve ser um app Slack separado do driver para que seu ID de usuário de bot seja distinto.
- `sutAppToken` - token no nível do app (`xapp-...`) do app SUT com `connections:write`, usado pelo Socket Mode para que o app SUT possa receber eventos.

Prefira um workspace Slack dedicado a QA em vez de reutilizar um workspace de produção.

O manifesto SUT abaixo estreita intencionalmente a instalação de produção do Plugin Slack empacotado (`extensions/slack/src/setup-shared.ts:10`) para as permissões e eventos cobertos pela suíte de QA ao vivo do Slack. Para a configuração do canal de produção como os usuários a veem, consulte [configuração rápida do canal Slack](/pt-BR/channels/slack#quick-setup); o par Driver/SUT de QA é intencionalmente separado porque a lane precisa de dois IDs de usuário de bot distintos em um workspace.

**1. Crie o app Driver**

Acesse [api.slack.com/apps](https://api.slack.com/apps) → _Criar novo app_ → _A partir de um manifesto_ → escolha o workspace de QA, cole o manifesto a seguir e então _Instalar no workspace_:

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

Copie o _Token OAuth de usuário bot_ (`xoxb-...`) - isso se torna `driverBotToken`. O driver só precisa postar mensagens e identificar a si mesmo; sem eventos, sem Socket Mode.

**2. Criar o app SUT**

Repita _Criar novo app → A partir de um manifesto_ no mesmo workspace. Este app de QA usa intencionalmente uma versão mais restrita do manifesto de produção do Plugin Slack incluído (`extensions/slack/src/setup-shared.ts:10`): escopos e eventos de reação são omitidos porque a suíte de QA ao vivo do Slack ainda não cobre o tratamento de reações.

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

- _Instalar no workspace_ → copie o _Token OAuth de usuário bot_ → isso se torna `sutBotToken`.
- _Informações básicas → Tokens no nível do app → Gerar token e escopos_ → adicione o escopo `connections:write` → salve → copie o valor `xapp-...` → isso se torna `sutAppToken`.

Verifique se os dois bots têm ids de usuário distintos chamando `auth.test` em cada token. O runtime distingue o driver e o SUT pelo id de usuário; reutilizar um app para ambos fará o controle por menções falhar imediatamente.

**3. Criar o canal**

No workspace de QA, crie um canal (por exemplo, `#openclaw-qa`) e convide ambos os bots de dentro do canal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copie o id `Cxxxxxxxxxx` em _informações do canal → Sobre → ID do canal_ - isso se torna `channelId`. Um canal público funciona; se você usar um canal privado, ambos os apps já têm `groups:history`, então as leituras de histórico do harness ainda terão sucesso.

**4. Registrar as credenciais**

Duas opções. Use variáveis de ambiente para depuração em uma única máquina (defina as quatro variáveis `OPENCLAW_QA_SLACK_*` e passe `--credential-source env`), ou alimente o pool compartilhado do Convex para que CI e outros mantenedores possam reservá-las.

Para o pool do Convex, escreva os quatro campos em um arquivo JSON:

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

Execute a trilha localmente para confirmar que ambos os bots conseguem conversar entre si por meio do intermediador:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Uma execução verde termina em bem menos de 30 segundos, e `slack-qa-report.md` mostra tanto `slack-canary` quanto `slack-mention-gating` com status `pass`. Se a trilha ficar travada por ~90 segundos e sair com `Convex credential pool exhausted for kind "slack"`, ou o pool está vazio ou todas as linhas estão concedidas por lease - `qa credentials list --kind slack --status all --json` indicará qual é o caso.

### QA do WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Mira duas contas dedicadas do WhatsApp Web: uma conta controladora controlada pela
estrutura de teste e uma conta SUT iniciada pelo Gateway OpenClaw filho por meio do
Plugin WhatsApp incluído.

Env obrigatório quando `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opcional:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` habilita cenários de grupo como
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, cenários de ação/mídia/enquete em grupo e
  `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` mantém corpos de mensagens em
  artefatos de mensagens observadas.

Catálogo de cenários (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Linha de base e controle de acesso por menção em grupo: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Comandos nativos: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Comportamento de resposta e saída final: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Ações de mensagem pelo caminho do usuário: `whatsapp-agent-message-action-react` começa a partir
  de uma DM real do controlador, permite que o modelo chame a ferramenta `message` e observa a
  reação nativa do WhatsApp. `whatsapp-agent-message-action-upload-file` usa
  a mesma postura para `message(action=upload-file)` e observa mídia nativa do
  WhatsApp. `whatsapp-group-agent-message-action-react` e
  `whatsapp-group-agent-message-action-upload-file` comprovam as mesmas ações visíveis
  ao usuário em um grupo real do WhatsApp.
- Distribuição para grupo: `whatsapp-broadcast-group-fanout` começa a partir de uma mensagem
  mencionada em grupo do WhatsApp e verifica respostas visíveis distintas de `main` e
  `qa-second`.
- Ativação em grupo: `whatsapp-group-activation-always` altera uma sessão real de grupo
  para `/activation always`, comprova que uma mensagem de grupo sem menção desperta
  o agente e então restaura `/activation mention`. `whatsapp-group-reply-to-bot-triggers`
  semeia uma resposta do bot, envia uma resposta nativa citada a ela sem uma
  menção explícita e verifica que o agente desperta a partir desse contexto de resposta.
- Mídia recebida e mensagens estruturadas: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Esses cenários enviam eventos reais de imagem, áudio, documento, localização, contato, figurinha
  e reação do WhatsApp por meio do controlador.
- Sondas diretas de contrato do Gateway:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Elas ignoram intencionalmente o prompt do modelo e
  comprovam contratos determinísticos de Gateway/canal para `send`, `poll` e `message.action`.
- Cobertura de controle de acesso: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Aprovações nativas: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reações de status: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Atualmente, o catálogo contém 50 cenários. A trilha padrão `live-frontier` é
mantida pequena, com 10 cenários, para cobertura rápida de verificação. A trilha padrão
`mock-openai` executa 44 cenários determinísticos pelo transporte real do WhatsApp enquanto
simula apenas a saída do modelo. Cenários de aprovação e algumas verificações mais pesadas/bloqueantes
continuam explícitos por ID de cenário.

O controlador de QA do WhatsApp observa eventos vivos estruturados (`text`, `media`,
`location`, `reaction` e `poll`) e pode enviar ativamente mídia, enquetes,
contatos, localizações e figurinhas. O QA Lab importa esse controlador pela
superfície do pacote `@openclaw/whatsapp/api.js`, em vez de acessar arquivos privados
do runtime do WhatsApp. Para observações de grupo, `fromJid` é o JID do grupo, enquanto
`participantJid` e `fromPhoneE164` identificam o remetente participante. O conteúdo
da mensagem é redigido por padrão. Sondas diretas de Gateway
para enquete, envio de arquivo, mídia, enquete em grupo, mídia em grupo e formato de resposta são verificações de contrato
de transporte/API; elas não são tratadas como prova de que um prompt de usuário fez o agente escolher
a mesma ação. A prova de ação pelo caminho do usuário vem de cenários como
`whatsapp-agent-message-action-react` e
`whatsapp-group-agent-message-action-react`, nos quais o controlador envia uma mensagem normal do
WhatsApp e o QA Lab observa o artefato nativo do WhatsApp resultante.
Relatórios do WhatsApp incluem a postura de cada cenário (`user-path`, `direct-gateway`
ou `native-approval`) para que a evidência não seja confundida com um contrato mais forte
do que ela de fato comprova.

Artefatos de saída:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - entradas de evidência para as verificações do transporte vivo.
- `whatsapp-qa-observed-messages.json` - corpos redigidos, a menos que `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pool de credenciais do Convex

As trilhas Telegram, Discord, Slack e WhatsApp podem conceder credenciais por lease a partir de um pool compartilhado do Convex em vez de ler as variáveis de ambiente acima. Passe `--credential-source convex` (ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); o QA Lab adquire um lease exclusivo, envia Heartbeats durante a execução e o libera no encerramento. Os tipos de pool são `"telegram"`, `"discord"`, `"slack"` e `"whatsapp"`.

Formatos de payload que o intermediador valida em `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` deve ser uma string numérica de chat-id.
- Usuário real do Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - somente prova do Mantis Telegram Desktop. As faixas genéricas do QA Lab não devem adquirir esse tipo.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - os números de telefone devem ser strings E.164 distintas.

O fluxo de trabalho de prova do Mantis Telegram Desktop mantém uma concessão
exclusiva `telegram-user` do Convex para o driver de CLI TDLib e a testemunha do
Telegram Desktop, depois a libera após publicar a prova.

Quando um PR precisa de um diff visual determinístico, o Mantis pode usar a
mesma resposta de modelo simulado em `main` e na cabeça do PR enquanto o
formatador do Telegram ou a camada de entrega muda. Os padrões de captura são
ajustados para comentários de PR: classe Crabbox padrão, gravação de desktop a
24 fps, GIF de movimento a 24 fps e largura de pré-visualização de 1920 px.
Comentários de antes/depois devem publicar um pacote limpo que contenha somente
os GIFs pretendidos.

As faixas do Slack também podem usar o pool. As verificações de formato de payload do Slack atualmente ficam no executor de QA do Slack, e não no intermediador; use `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, com um id de canal do Slack como `Cxxxxxxxxxx`. Consulte [Configurar o workspace do Slack](#setting-up-the-slack-workspace) para provisionar o app e os escopos.

As variáveis de ambiente operacionais e o contrato de endpoint do intermediador Convex ficam em [Testes → Credenciais compartilhadas do Telegram via Convex](/pt-BR/help/testing#shared-telegram-credentials-via-convex-v1) (o nome da seção é anterior ao pool multicanal; a semântica de concessão é compartilhada entre os tipos).

## Seeds versionados no repositório

Os ativos de seed ficam em `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Eles estão intencionalmente no git para que o plano de QA seja visível tanto
para humanos quanto para o agente.

`qa-lab` deve permanecer um executor genérico de cenários YAML. Cada arquivo
YAML de cenário é a fonte da verdade para uma execução de teste e deve definir:

- `title` no nível superior
- metadados de `scenario`
- metadados opcionais de categoria, capability, faixa e risco em `scenario`
- referências de docs e código em `scenario`
- requisitos opcionais de plugin em `scenario`
- patch opcional de config do gateway em `scenario`
- `flow` executável no nível superior para cenários de fluxo, ou `scenario.execution.kind` /
  `scenario.execution.path` para cenários de Vitest e Playwright

A superfície de runtime reutilizável que sustenta `flow` pode permanecer
genérica e transversal. Por exemplo, cenários YAML podem combinar helpers do
lado do transporte com helpers do lado do navegador que conduzem a Control UI
embutida pelo ponto de integração `browser.request` do Gateway sem adicionar um
executor especial.

Arquivos de cenário devem ser agrupados por capability do produto em vez de
pasta da árvore de código-fonte. Mantenha os IDs de cenário estáveis quando os
arquivos forem movidos; use `docsRefs` e `codeRefs` para rastreabilidade da
implementação.

A lista baseline deve permanecer ampla o suficiente para cobrir:

- chat por DM e canal
- comportamento de thread
- ciclo de vida de ações de mensagem
- callbacks cron
- recuperação de memória
- troca de modelo
- passagem para subagente
- leitura de repositório e leitura de docs
- uma pequena tarefa de build, como Lobster Invaders

## Faixas de mock de provider

`qa suite` tem duas faixas locais de mock de provider:

- `mock-openai` é o mock do OpenClaw ciente de cenários. Ele continua sendo a
  faixa de mock determinística padrão para QA versionado no repositório e gates
  de paridade.
- `aimock` inicia um servidor de provider baseado em AIMock para cobertura
  experimental de protocolo, fixture, gravação/reprodução e caos. Ele é aditivo
  e não substitui o despachante de cenários `mock-openai`.

A implementação das faixas de provider fica em `extensions/qa-lab/src/providers/`.
Cada provider é dono de seus padrões, inicialização do servidor local, config de
modelo do gateway, necessidades de staging de perfil de autenticação e flags de
capability live/mock. O código compartilhado da suite e do gateway deve rotear
pelo registro de providers em vez de ramificar em nomes de providers.

## Adaptadores de transporte

`qa-lab` possui um ponto de integração de transporte genérico para cenários QA
YAML. `qa-channel` é o padrão sintético. `crabline` inicia servidores locais em
formato de provider e executa os plugins de canal normais do OpenClaw contra
eles. `live` é reservado para credenciais reais de provider e canais externos.

No nível de arquitetura, a divisão é:

- `qa-lab` possui execução genérica de cenários, concorrência de workers, escrita de artefatos e relatórios.
- O adaptador de transporte possui config do gateway, prontidão, observação de entrada e saída, ações de transporte e estado de transporte normalizado.
- Arquivos de cenário YAML em `qa/scenarios/` definem a execução de teste; `qa-lab` fornece a superfície de runtime reutilizável que os executa.

### Adicionar um canal

Adicionar um canal ao sistema de QA YAML exige a implementação do canal mais
um pacote de cenários que exercite o contrato do canal. Para cobertura smoke em
CI, adicione o servidor local de provider Crabline correspondente e exponha-o
pelo driver `crabline`.

Não adicione uma nova raiz de comando QA de nível superior quando o host compartilhado `qa-lab` puder possuir o fluxo.

`qa-lab` possui a mecânica de host compartilhado:

- a raiz de comando `openclaw qa`
- inicialização e teardown da suite
- concorrência de workers
- escrita de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários `qa-channel` mais antigos

Plugins executores possuem o contrato de transporte:

- como `openclaw qa <runner>` é montado sob a raiz compartilhada `qa`
- como o gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcrições e estado de transporte normalizado são expostos
- como ações com suporte de transporte são executadas
- como reset ou limpeza específicos do transporte são tratados

O patamar mínimo de adoção para um novo canal:

1. Mantenha `qa-lab` como dono da raiz compartilhada `qa`.
2. Implemente o executor de transporte no ponto de integração do host compartilhado `qa-lab`.
3. Mantenha a mecânica específica do transporte dentro do plugin executor ou harness de canal.
4. Monte o executor como `openclaw qa <runner>` em vez de registrar um comando raiz concorrente. Plugins executores devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array `qaRunnerCliRegistrations` correspondente de `runtime-api.ts`. Mantenha `runtime-api.ts` leve; CLI lazy e execução do executor devem permanecer atrás de entrypoints separados.
5. Crie ou adapte cenários YAML nos diretórios temáticos `qa/scenarios/`.
6. Use os helpers genéricos de cenário para novos cenários.
7. Mantenha os aliases de compatibilidade existentes funcionando, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é estrita:

- Se o comportamento puder ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se o comportamento depender de um transporte de canal, mantenha-o nesse plugin executor ou harness de plugin.
- Se um cenário precisar de uma nova capability que mais de um canal pode usar, adicione um helper genérico em vez de uma ramificação específica de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico do transporte e deixe isso explícito no contrato do cenário.

### Nomes de helpers de cenário

Helpers genéricos preferidos para novos cenários:

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

Aliases de compatibilidade continuam disponíveis para cenários existentes - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - mas a autoria de novos cenários deve usar os nomes genéricos. Os aliases existem para evitar uma migração em flag day, não como o modelo daqui em diante.

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada do bus.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento vale a pena adicionar

Para o inventário de cenários disponíveis - útil ao dimensionar trabalho de acompanhamento ou conectar um novo transporte - execute `pnpm openclaw qa coverage` (adicione `--json` para saída legível por máquina).
Ao escolher prova focada para um comportamento ou caminho de arquivo tocado, execute `pnpm openclaw qa coverage --match <query>`.
O relatório de correspondência pesquisa metadados de cenário, refs de docs, refs de código, IDs de cobertura, plugins e requisitos de provider, depois imprime alvos `qa suite --scenario ...` correspondentes.
Cada execução de `qa suite` grava artefatos `qa-evidence.json`,
`qa-suite-summary.json` e `qa-suite-report.md` no nível superior para o conjunto
de cenários selecionado. Cenários que declaram `execution.kind: vitest` ou
`execution.kind: playwright` executam o caminho de teste correspondente e também
gravam logs por cenário. Cenários que declaram `execution.kind: script` executam
o produtor de evidências em `execution.path` por `node --import tsx` (com
`${outputDir}` e `${scenarioId}` expandidos em `execution.args`); o produtor
grava seu próprio `qa-evidence.json`, cujas entradas são importadas para a
saída da suite e cujos caminhos de artefato são resolvidos em relação a esse
`qa-evidence.json` do produtor. Quando `qa suite` é alcançado por
`qa run --qa-profile`, o mesmo `qa-evidence.json` também inclui o resumo do
scorecard de perfil para as categorias de taxonomia selecionadas.
Trate isso como auxílio de descoberta, não como substituto de gate; o cenário selecionado ainda precisa do modo de provider, transporte live, Multipass, Testbox ou faixa de release corretos para o comportamento em teste.
Para contexto do scorecard, consulte [Scorecard de maturidade](/pt-BR/maturity/scorecard).

Para verificações de caráter e estilo, execute o mesmo cenário em múltiplas refs
de modelo live e grave um relatório julgado em Markdown:

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

O comando executa processos filhos locais do Gateway de QA, não Docker. Cenários de avaliação de personagem
devem definir a persona por meio de `SOUL.md` e então executar turnos comuns do usuário
como chat, ajuda no workspace e pequenas tarefas de arquivo. O modelo candidato não deve
ser informado de que está sendo avaliado. O comando preserva cada transcrição completa,
registra estatísticas básicas da execução e então pede aos modelos juízes, em modo rápido com
raciocínio `xhigh` quando compatível, que classifiquem as execuções por naturalidade, vibe e humor.
Use `--blind-judge-models` ao comparar provedores: o prompt do juiz ainda recebe
cada transcrição e status de execução, mas as refs candidatas são substituídas por rótulos neutros
como `candidate-01`; o relatório mapeia as classificações de volta para as refs reais após
o parsing.
As execuções candidatas usam `high` como thinking padrão, com `medium` para GPT-5.5 e `xhigh`
para refs de avaliação OpenAI mais antigas que o suportam. Sobrescreva um candidato específico inline com
`--model provider/model,thinking=<level>`. `--thinking <level>` ainda define um
fallback global, e a forma mais antiga `--model-thinking <provider/model=level>` é
mantida por compatibilidade.
Refs candidatas OpenAI usam modo rápido por padrão para que o processamento prioritário seja usado onde
o provedor o suporta. Adicione `,fast`, `,no-fast` ou `,fast=false` inline quando um
único candidato ou juiz precisar de uma sobrescrita. Passe `--fast` somente quando quiser
forçar o modo rápido para todos os modelos candidatos. As durações de candidatos e juízes são
registradas no relatório para análise de benchmark, mas os prompts dos juízes dizem explicitamente
para não classificar por velocidade.
As execuções dos modelos candidatos e juízes usam concorrência 16 por padrão. Reduza
`--concurrency` ou `--judge-concurrency` quando limites do provedor ou pressão do Gateway local
tornarem uma execução ruidosa demais.
Quando nenhum candidato `--model` é passado, a avaliação de personagem usa por padrão
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando nenhum `--model` é passado.
Quando nenhum `--judge-model` é passado, os juízes usam por padrão
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-8,thinking=high`.

## Docs relacionados

- [QA de matriz](/pt-BR/concepts/qa-matrix)
- [Scorecard de maturidade](/pt-BR/maturity/scorecard)
- [Pacote de benchmark de agente pessoal](/pt-BR/concepts/personal-agent-benchmark-pack)
- [Canal de QA](/pt-BR/channels/qa-channel)
- [Testes](/pt-BR/help/testing)
- [Dashboard](/pt-BR/web/dashboard)
