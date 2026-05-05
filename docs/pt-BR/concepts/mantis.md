---
read_when:
    - Criar ou executar QA visual ao vivo para bugs do OpenClaw
    - Adicionando verificação antes e depois para uma solicitação de pull
    - Adicionar cenários de transporte ao vivo do Discord, Slack, WhatsApp ou outros
    - Depuração de execuções de QA que precisam de capturas de tela, automação de navegador ou acesso VNC
summary: Mantis é o sistema visual de verificação de ponta a ponta para reproduzir bugs do OpenClaw em transportes reais, capturar evidências de antes e depois e anexar artefatos a PRs.
title: Louva-a-deus
x-i18n:
    generated_at: "2026-05-05T05:42:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26a9671135e38bf82d3627364f691f8d91cc8649ffc2e5fa782ebef474a44fa1
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis é o sistema de verificação de ponta a ponta da OpenClaw para bugs que precisam de um
runtime real, um transporte real e prova visível. Ele executa um cenário contra uma ref
sabidamente ruim, captura evidências, executa o mesmo cenário contra uma ref candidata e
publica a comparação como artefatos que um mantenedor pode inspecionar a partir de um PR ou
de um comando local.

Mantis começa com Discord porque Discord nos dá uma primeira via de alto valor:
autenticação real de bot, canais reais de guilda, reações, threads, comandos nativos e uma
interface de usuário de navegador em que humanos podem confirmar visualmente o que o transporte mostrou.

## Objetivos

- Reproduzir um bug de uma issue ou PR do GitHub com o mesmo formato de transporte que os usuários
  veem.
- Capturar um artefato **antes** na ref de linha de base antes de aplicar a correção.
- Capturar um artefato **depois** na ref candidata depois de aplicar a correção.
- Usar um oráculo determinístico sempre que possível, como uma leitura de reação via REST do Discord
  ou uma verificação de transcrição de canal.
- Capturar capturas de tela quando o bug tiver uma superfície de interface visível.
- Executar localmente a partir de uma CLI controlada por agente e remotamente a partir do GitHub.
- Preservar estado de máquina suficiente para resgate por VNC quando login, automação de navegador ou
  autenticação de provedor travar.
- Publicar status conciso em um canal Discord de operador quando a execução estiver bloqueada,
  precisar de ajuda manual por VNC ou terminar.

## Não objetivos

- Mantis não é um substituto para testes unitários. Uma execução do Mantis normalmente deve se tornar
  um teste de regressão menor depois que a correção for entendida.
- Mantis não é o gate de CI rápido normal. Ele é mais lento, usa credenciais live e
  é reservado para bugs em que o ambiente live importa.
- Mantis não deve exigir um humano para a operação normal. VNC manual é um caminho de resgate,
  não o caminho esperado.
- Mantis não armazena segredos brutos em artefatos, logs, capturas de tela, relatórios Markdown
  ou comentários de PR.

## Responsabilidade

Mantis vive na pilha de QA da OpenClaw.

- OpenClaw é responsável pelo runtime de cenários, adaptadores de transporte, esquema de evidências e
  CLI local em `pnpm openclaw qa mantis`.
- QA Lab é responsável pelas partes do harness de transporte live, helpers de captura de navegador e
  gravadores de artefatos.
- Crabbox é responsável por máquinas Linux aquecidas quando uma VM remota é necessária.
- GitHub Actions é responsável pelo ponto de entrada do workflow remoto e pela retenção de artefatos.
- ClawSweeper é responsável pelo roteamento de comentários do GitHub: analisar comandos de mantenedor,
  despachar o workflow e publicar o comentário final no PR.
- Agentes da OpenClaw conduzem Mantis por meio do Codex quando um cenário precisa de configuração agentic,
  depuração ou relatório de estado travado.

Esse limite mantém o conhecimento de transporte na OpenClaw, o agendamento de máquinas no
Crabbox e a cola de workflow de mantenedor no ClawSweeper.

## Formato dos comandos

O primeiro comando local verifica o bot do Discord, guilda, canal, envio de mensagem,
envio de reação e caminho de artefato:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

O executor local de antes e depois aceita este formato:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

O executor cria worktrees desconectadas de linha de base e candidata sob o diretório de saída,
instala dependências, compila cada ref, executa o cenário com
`--allow-failures`, depois grava `baseline/`, `candidate/`, `comparison.json`
e `mantis-report.md`. Para o primeiro cenário Discord, uma verificação bem-sucedida
significa que o status da linha de base é `fail` e o status da candidata é `pass`.

A primeira primitiva de VM/navegador é o smoke de desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Ela aloca ou reutiliza uma máquina desktop Crabbox, inicia um navegador visível dentro da
sessão VNC, captura o desktop, puxa artefatos de volta para o diretório de saída local
e grava o comando de reconexão no relatório. O comando usa por padrão o provedor Hetzner
porque ele é o primeiro provedor com cobertura funcional de desktop/VNC na via Mantis.
Substitua-o com `--provider`, `--crabbox-bin` ou
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` ao executar contra outra frota Crabbox.

Flags úteis do smoke de desktop:

- `--lease-id <cbx_...>` ou `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reutiliza um desktop aquecido.
- `--browser-url <url>` altera a página aberta no navegador visível.
- `--html-file <path>` renderiza um artefato HTML local do repositório no navegador visível. Mantis usa isso para capturar a linha do tempo gerada de reação de status do Discord por meio de um desktop Crabbox real.
- `--keep-lease` ou `OPENCLAW_MANTIS_KEEP_VM=1` mantém uma lease recém-criada e aprovada aberta para inspeção por VNC. Execuções com falha mantêm a lease por padrão quando uma foi criada para que um operador possa reconectar.
- `--class`, `--idle-timeout` e `--ttl` ajustam o tamanho da máquina e o tempo de vida da lease.

A primeira primitiva completa de transporte de desktop é o smoke de desktop do Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ela aloca ou reutiliza uma máquina desktop Crabbox, sincroniza o checkout atual para
a VM, executa `pnpm openclaw qa slack` dentro dessa VM, abre o Slack Web no navegador
VNC, captura o desktop visível e copia tanto os artefatos de QA do Slack quanto
a captura de tela VNC de volta para o diretório de saída local. Este é o primeiro formato
do Mantis em que o Gateway OpenClaw SUT e o navegador vivem dentro da mesma
VM desktop Linux.

Com `--gateway-setup`, o comando prepara uma home OpenClaw descartável persistente
em `$HOME/.openclaw-mantis/slack-openclaw`, corrige a configuração do Socket Mode do Slack
para o canal selecionado, inicia `openclaw gateway run` na porta
`38973` e mantém o Chrome em execução na sessão VNC. Este é o modo "deixe-me um
desktop Linux com Slack e uma claw em execução"; a via de QA Slack bot-para-bot
continua sendo o padrão quando `--gateway-setup` é omitido.

Entradas obrigatórias para `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para a via de modelo remota. Se apenas
  `OPENAI_API_KEY` estiver definido localmente, Mantis o mapeia para `OPENCLAW_LIVE_OPENAI_KEY`
  antes de invocar o Crabbox para que o encaminhamento de env `OPENCLAW_*` do Crabbox possa levá-lo
  para dentro da VM.

Flags úteis do desktop Slack:

- `--lease-id <cbx_...>` executa novamente contra uma máquina em que um operador já fez login no Slack Web por VNC.
- `--gateway-setup` inicia um Gateway Slack OpenClaw persistente na VM em vez de executar apenas a via de QA bot-para-bot.
- `--slack-url <url>` abre uma URL específica do Slack Web. Sem isso, Mantis deriva `https://app.slack.com/client/<team>/<channel>` de `auth.test` do Slack quando o token do bot SUT está disponível.
- `--slack-channel-id <id>` controla a lista de permissões de canais Slack usada pela configuração do Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla o perfil persistente do Chrome dentro da VM. O padrão é `$HOME/.config/openclaw-mantis/slack-chrome-profile`, de modo que um login manual no Slack Web sobreviva a novas execuções na mesma lease.
- `--credential-source convex --credential-role ci` usa o pool de credenciais compartilhado em vez de tokens env diretos do Slack.
- `--provider-mode`, `--model`, `--alt-model` e `--fast` são repassados para a via live do Slack.

O workflow de smoke do GitHub é `Mantis Discord Smoke`. O workflow de antes e depois do GitHub
para o primeiro cenário real é `Mantis Discord Status Reactions`. Ele
aceita:

- `baseline_ref`: a ref esperada para reproduzir o comportamento apenas em fila.
- `candidate_ref`: a ref esperada para mostrar `queued -> thinking -> done`.

Ele faz checkout da ref do harness de workflow, compila worktrees separadas de linha de base e candidata,
executa `discord-status-reactions-tool-only` contra cada worktree e
envia `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md` como
artefatos do Actions. Ele também renderiza o HTML da linha do tempo de cada via em um navegador desktop
Crabbox e publica essas capturas de tela VNC ao lado dos PNGs determinísticos
da linha do tempo no comentário do PR. O mesmo comentário do PR inclui links para as gravações MP4
do desktop capturadas durante a renderização no navegador VNC, enquanto as capturas de tela ficam
inline para revisão rápida. O workflow compila a CLI Crabbox a partir de
`openclaw/crabbox` main para poder usar as flags atuais de lease de desktop/navegador
antes que a próxima versão binária do Crabbox seja lançada.

Você também pode acionar a execução de reações de status diretamente a partir de um comentário de PR:

```text
@Mantis discord status reactions
```

O gatilho de comentário é intencionalmente estreito. Ele só executa em comentários de pull request
de usuários com acesso write, maintain ou admin, e só reconhece
solicitações de reação de status do Discord. Por padrão, ele usa a ref de linha de base sabidamente ruim
e o SHA head atual do PR como candidata. Mantenedores podem substituir qualquer uma das
refs:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Exemplos de comandos do ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

O primeiro comando é explícito e focado no cenário. O segundo pode posteriormente mapear um PR
ou issue para cenários Mantis recomendados a partir de labels, arquivos alterados e
achados de revisão do ClawSweeper.

## Ciclo de vida da execução

1. Obter credenciais.
2. Alocar ou reutilizar uma VM.
3. Preparar o perfil de desktop/navegador quando o cenário precisar de evidência de interface.
4. Preparar um checkout limpo para a ref de linha de base.
5. Instalar dependências e compilar apenas o que o cenário precisa.
6. Iniciar um Gateway OpenClaw filho com um diretório de estado isolado.
7. Configurar o transporte live, provedor, modelo e perfil de navegador.
8. Executar o cenário e capturar evidências de linha de base.
9. Parar o Gateway e preservar logs.
10. Preparar a ref candidata na mesma VM.
11. Executar o mesmo cenário e capturar evidências da candidata.
12. Comparar os resultados do oráculo e as evidências visuais.
13. Gravar Markdown, JSON, logs, capturas de tela e artefatos opcionais de trace.
14. Enviar artefatos do GitHub Actions.
15. Publicar uma mensagem concisa de status no PR ou no Discord.

O cenário deve ser capaz de falhar de duas maneiras diferentes:

- **Bug reproduzido**: a linha de base falhou da forma esperada.
- **Falha do harness**: configuração de ambiente, credenciais, API do Discord, navegador ou
  provedor falhou antes que o oráculo do bug fosse significativo.

O relatório final deve separar esses casos para que mantenedores não confundam um ambiente
instável com comportamento do produto.

## MVP do Discord

O primeiro cenário deve mirar reações de status do Discord em canais de guilda em que
o modo de entrega da resposta de origem é `message_tool_only`.

Por que é uma boa semente para o Mantis:

- É visível no Discord como reações na mensagem acionadora.
- Tem um oráculo REST forte por meio do estado de reação de mensagem do Discord.
- Exercita um Gateway OpenClaw real, autenticação de bot Discord, despacho de mensagem,
  modo de entrega da resposta de origem, estado de reação de status e ciclo de vida de turno do modelo.
- É estreito o suficiente para manter a primeira implementação honesta.

Formato esperado do cenário:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

As evidências de linha de base devem mostrar a reação de reconhecimento em fila, mas nenhuma
transição de ciclo de vida no modo apenas ferramenta. As evidências da candidata devem mostrar reações
de status de ciclo de vida em execução quando `messages.statusReactions.enabled` está explicitamente
true.

A primeira fatia executável é o cenário de QA live Discord opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Ele configura o SUT com tratamento de guild sempre ativo, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` e reações de status explícitas. O oráculo
consulta a mensagem de acionamento real do Discord e espera a sequência observada
`👀 -> 🤔 -> 👍`. Os artefatos incluem `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` e
`discord-status-reactions-tool-only-timeline.png`.

## Peças de QA existentes

O Mantis deve se basear na pilha privada de QA existente em vez de começar do
zero:

- `pnpm openclaw qa discord` já executa uma faixa do Discord ao vivo com bots de
  driver e SUT.
- O executor de transporte ao vivo já grava relatórios e artefatos de mensagens
  observadas em `.artifacts/qa-e2e/`.
- Concessões de credenciais do Convex já fornecem acesso exclusivo a credenciais
  compartilhadas de transporte ao vivo.
- O serviço de controle do navegador já oferece suporte a capturas de tela,
  snapshots, perfis gerenciados headless e perfis CDP remotos.
- O QA Lab já tem uma UI de depurador e um barramento para testes no formato de
  transporte.

A primeira implementação do Mantis pode ser um executor simples de antes/depois
sobre essas peças, mais uma camada de evidência visual.

## Modelo de evidências

Cada execução grava um diretório de artefatos estável:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` deve ser a fonte da verdade legível por máquina. O
relatório em Markdown é para comentários em PRs e revisão humana.

O resumo deve incluir:

- refs e SHAs testados
- transporte e id do cenário
- provedor da máquina e id da máquina ou id da concessão
- fonte das credenciais sem valores secretos
- resultado da baseline
- resultado do candidato
- se o bug foi reproduzido na baseline
- se o candidato o corrigiu
- caminhos dos artefatos
- problemas sanitizados de configuração ou limpeza

Capturas de tela são evidências, não segredos. Ainda assim, precisam de
disciplina de redação: nomes de canais privados, nomes de usuários ou conteúdo
de mensagens podem aparecer. Para PRs públicos, prefira links de artefatos do
GitHub Actions em vez de imagens embutidas até que a estratégia de redação esteja
mais forte.

## Navegador e VNC

A faixa do navegador tem dois modos:

- **Automação headless**: padrão para CI. O Chrome é executado com CDP ativado, e
  o Playwright ou o controle de navegador do OpenClaw captura screenshots.
- **Resgate por VNC**: ativado na mesma VM quando login, MFA, anti-automação do
  Discord ou depuração visual exigem uma pessoa.

O perfil do navegador observador do Discord deve ser persistente o bastante para
evitar login a cada execução, mas isolado do estado do navegador pessoal. Um
perfil pertence ao pool de máquinas do Mantis, não ao laptop de um desenvolvedor.

Quando o Mantis trava, ele publica uma mensagem de status no Discord com:

- id da execução
- id do cenário
- provedor da máquina
- diretório de artefatos
- instruções de conexão VNC ou noVNC, se disponíveis
- texto curto do bloqueio

A primeira implantação privada pode publicar essas mensagens no canal de
operadores existente e depois migrar para um canal dedicado do Mantis.

## Máquinas

O Mantis deve preferir AWS por meio do Crabbox para a primeira implementação
remota. O Crabbox nos dá máquinas aquecidas, rastreamento de concessões,
hidratação, logs, resultados e limpeza. Se a capacidade da AWS estiver lenta
demais ou indisponível, adicione um provedor Hetzner por trás da mesma interface
de máquina.

Requisitos mínimos da VM:

- Linux com instalação de Chrome ou Chromium capaz de desktop
- acesso CDP para automação do navegador
- VNC ou noVNC para resgate
- Node 22 e pnpm
- checkout do OpenClaw e cache de dependências
- cache do navegador Chromium do Playwright quando Playwright for usado
- CPU e memória suficientes para um OpenClaw Gateway, um navegador e uma
  execução de modelo
- acesso de saída ao Discord, GitHub, provedores de modelo e ao broker de
  credenciais

A VM não deve manter segredos brutos de longa duração fora dos armazenamentos de
credenciais ou de perfis de navegador esperados.

## Segredos

Segredos ficam em segredos de organização ou repositório do GitHub para execuções
remotas, e em um arquivo de segredos local controlado pelo operador para
execuções locais.

Nomes de segredos recomendados:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para uploads públicos de artefatos do GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

No longo prazo, o pool de credenciais do Convex deve continuar sendo a fonte
normal de credenciais de transporte ao vivo. Segredos do GitHub inicializam o
broker e as faixas de fallback. O workflow de reações de status do Discord mapeia
os segredos do Mantis Crabbox de volta para as variáveis de ambiente
`CRABBOX_COORDINATOR` e `CRABBOX_COORDINATOR_TOKEN` esperadas pela CLI do
Crabbox. Os nomes simples de segredos do GitHub `CRABBOX_*` continuam aceitos
como fallback de compatibilidade.

O executor do Mantis nunca deve imprimir:

- tokens de bot do Discord
- chaves de API de provedores
- cookies de navegador
- conteúdos de perfis de autenticação
- senhas de VNC
- payloads brutos de credenciais

Uploads públicos de artefatos também devem redigir metadados do alvo no Discord,
como ids de bot, guild, canal e mensagem. O workflow de smoke do GitHub ativa
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` por esse motivo.

Se um token for colado acidentalmente em uma issue, PR, chat ou log, faça rotação
dele depois que o novo segredo tiver sido armazenado.

## Artefatos do GitHub e comentários em PRs

Os workflows do Mantis devem enviar o pacote completo de evidências como um
artefato de curta duração do Actions. Quando o workflow é executado para um
relatório de bug ou PR de correção, ele também deve publicar as capturas de tela
PNG redigidas no branch `qa-artifacts` e atualizar ou inserir um comentário nesse
bug ou PR de correção com capturas de tela antes/depois embutidas. Não publique a
prova principal apenas em um PR genérico de automação de QA. Logs brutos,
mensagens observadas e outras evidências volumosas ficam no artefato do Actions.

Workflows de produção devem publicar esses comentários com o GitHub App do
Mantis, não com `github-actions[bot]`. Armazene o id do app e a chave privada
como segredos do GitHub Actions `MANTIS_GITHUB_APP_ID` e
`MANTIS_GITHUB_APP_PRIVATE_KEY`. O workflow usa um marcador oculto como chave de
atualização/inserção, atualiza esse comentário quando o token consegue editá-lo e
cria um novo comentário de propriedade do Mantis quando um marcador antigo de
propriedade de bot não pode ser editado.

O comentário no PR deve ser curto e visual:

```md
Mantis Discord Status Reactions QA

Resumo: o Mantis reexecutou o bug reportado de reação de status do Discord contra a
baseline ruim conhecida e a correção candidata. A baseline reproduziu o bug,
enquanto o candidato mostrou a sequência esperada queued -> thinking -> done.

- Cenário: `discord-status-reactions-tool-only`
- Execução: <workflow run link>
- Artefato: <artifact link>
- Baseline: `<status>` em `<sha>`
- Candidato: `<status>` em `<sha>`

| Baseline            | Candidato           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Quando a execução falhar porque o harness falhou, o comentário deve dizer isso em
vez de sugerir que o candidato falhou.

## Notas de implantação privada

Uma implantação privada talvez já tenha uma aplicação Discord do Mantis.
Reutilize essa aplicação em vez de criar outro app quando ela tiver as permissões
de bot corretas e puder passar por rotação com segurança.

Defina o canal inicial de notificação do operador por meio de segredos ou
configuração de implantação. Ele pode apontar primeiro para um canal existente de
mantenedores ou operações e depois migrar para um canal dedicado do Mantis quando
um existir.

Não coloque ids de guild, ids de canal, tokens de bot, cookies de navegador nem
senhas de VNC neste documento. Armazene-os em segredos do GitHub, no broker de
credenciais ou no armazenamento local de segredos do operador.

## Adicionando um cenário

Um cenário do Mantis deve declarar:

- id e título
- transporte
- credenciais necessárias
- política de ref da baseline
- política de ref do candidato
- patch de configuração do OpenClaw
- etapas de configuração
- estímulo
- oráculo esperado da baseline
- oráculo esperado do candidato
- alvos de captura visual
- orçamento de timeout
- etapas de limpeza

Cenários devem preferir oráculos pequenos e tipados:

- estado de reação do Discord para bugs de reação
- referências de mensagens do Discord para bugs de threading
- thread ts do Slack e estado da API de reação para bugs do Slack
- ids e cabeçalhos de mensagens de email para bugs de email
- capturas de tela do navegador quando a UI é o único observável confiável

Verificações por visão devem ser aditivas. Se uma API da plataforma puder provar
o bug, use a API como oráculo de aprovado/reprovado e mantenha capturas de tela
para confiança humana.

## Expansão de provedores

Depois do Discord, o mesmo executor pode adicionar:

- Slack: reações, threads, menções ao app, modais, uploads de arquivos.
- Email: autenticação do Gmail e threading de mensagens usando `gog` quando
  conectores não forem suficientes.
- WhatsApp: login por QR, reidentificação, entrega de mensagens, mídia, reações.
- Telegram: bloqueio por menção em grupo, comandos, reações quando disponíveis.
- Matrix: salas criptografadas, relações de thread ou resposta, retomada após
  reinício.

Cada transporte deve ter um cenário de smoke barato e um ou mais cenários de
classe de bug. Cenários visuais caros devem continuar opt-in.

## Perguntas em aberto

- Qual bot do Discord deve ser o driver, e qual deve ser o SUT, quando o bot
  existente do Mantis for reutilizado?
- O login do navegador observador deve usar uma conta humana do Discord, uma
  conta de teste ou apenas evidência REST legível por bot na primeira fase?
- Por quanto tempo o GitHub deve reter artefatos do Mantis para PRs?
- Quando o ClawSweeper deve recomendar automaticamente o Mantis em vez de esperar
  por um comando de mantenedor?
- As capturas de tela devem ser redigidas ou recortadas antes do upload para PRs
  públicos?
