---
read_when:
    - Criar ou executar QA visual ao vivo para bugs do OpenClaw
    - Adicionando verificação antes e depois a uma solicitação de pull
    - Adicionando cenários de transporte ao vivo para Discord, Slack, WhatsApp ou outros
    - Depuração de execuções de QA que precisam de capturas de tela, automação de navegador ou acesso VNC
summary: Mantis é o sistema visual de verificação de ponta a ponta para reproduzir erros do OpenClaw em transportes ao vivo, capturar evidências de antes e depois e anexar artefatos aos PRs.
title: Louva-a-deus
x-i18n:
    generated_at: "2026-05-06T05:50:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis é o sistema de verificação de ponta a ponta do OpenClaw para bugs que precisam de um
runtime real, um transporte real e prova visível. Ele executa um cenário contra uma ref
conhecidamente ruim, captura evidências, executa o mesmo cenário contra uma ref candidata e
publica a comparação como artefatos que um mantenedor pode inspecionar a partir de um PR ou
de um comando local.

Mantis começa com Discord porque Discord nos dá uma primeira lane de alto valor:
autenticação real de bot, canais reais de guild, reações, threads, comandos nativos e uma
UI de navegador em que humanos podem confirmar visualmente o que o transporte mostrou.

## Objetivos

- Reproduzir um bug de uma issue ou PR do GitHub com o mesmo formato de transporte que os usuários
  veem.
- Capturar um artefato **antes** na ref de baseline antes de aplicar a correção.
- Capturar um artefato **depois** na ref candidata depois de aplicar a correção.
- Usar um oráculo determinístico sempre que possível, como uma leitura de reação pela REST do Discord
  ou uma verificação de transcrição de canal.
- Capturar capturas de tela quando o bug tiver uma superfície de UI visível.
- Executar localmente a partir de uma CLI controlada por agente e remotamente a partir do GitHub.
- Preservar estado de máquina suficiente para resgate por VNC quando login, automação de navegador ou
  autenticação de provedor ficarem travados.
- Postar status conciso em um canal de operador no Discord quando a execução estiver bloqueada,
  precisar de ajuda manual por VNC ou terminar.

## Não objetivos

- Mantis não é substituto para testes unitários. Uma execução do Mantis normalmente deve se tornar
  um teste de regressão menor depois que a correção for entendida.
- Mantis não é o gate normal e rápido de CI. Ele é mais lento, usa credenciais reais e
  é reservado para bugs em que o ambiente real importa.
- Mantis não deve exigir um humano para operação normal. VNC manual é um caminho de resgate,
  não o caminho feliz.
- Mantis não armazena segredos brutos em artefatos, logs, capturas de tela, relatórios Markdown
  ou comentários de PR.

## Propriedade

Mantis vive na stack de QA do OpenClaw.

- OpenClaw é dono do runtime de cenário, adaptadores de transporte, esquema de evidências e
  CLI local em `pnpm openclaw qa mantis`.
- QA Lab é dono das partes do harness de transporte ao vivo, helpers de captura de navegador e
  gravadores de artefatos.
- Crabbox é dono de máquinas Linux aquecidas quando uma VM remota é necessária.
- GitHub Actions é dono do ponto de entrada do workflow remoto e da retenção de artefatos.
- ClawSweeper é dono do roteamento de comentários do GitHub: análise de comandos de mantenedores,
  despacho do workflow e postagem do comentário final no PR.
- Agentes OpenClaw conduzem o Mantis por meio do Codex quando um cenário precisa de configuração agêntica,
  depuração ou relatório de estado travado.

Esse limite mantém o conhecimento de transporte no OpenClaw, o agendamento de máquinas no
Crabbox e a cola do workflow de mantenedores no ClawSweeper.

## Formato do comando

O primeiro comando local verifica o bot do Discord, guild, canal, envio de mensagem,
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

O executor cria worktrees detached de baseline e candidata sob o diretório de saída,
instala dependências, compila cada ref, executa o cenário com
`--allow-failures` e então grava `baseline/`, `candidate/`, `comparison.json`
e `mantis-report.md`. Para o primeiro cenário Discord, uma verificação bem-sucedida
significa que o status da baseline é `fail` e o status da candidata é `pass`.

A segunda sonda Discord de antes/depois mira anexos em threads:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Esse cenário posta uma mensagem pai com o bot driver, cria uma thread real no Discord,
chama a ação `message.thread-reply` do OpenClaw com um `filePath` local ao repo,
depois consulta a thread pelo polling da resposta do SUT e do nome de arquivo do anexo. A
captura de tela da baseline mostra a resposta sem anexo; a captura de tela candidata
mostra o anexo esperado `mantis-thread-report.md`.

A primeira primitiva de VM/navegador é o smoke de desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Ela aluga ou reutiliza uma máquina desktop Crabbox, inicia um navegador visível dentro da
sessão VNC, captura o desktop, traz os artefatos de volta para o diretório de saída local
e grava o comando de reconexão no relatório. O comando usa por padrão o provedor Hetzner
porque ele é o primeiro provedor com cobertura desktop/VNC funcional na lane Mantis.
Sobrescreva com `--provider`, `--crabbox-bin` ou
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` ao executar contra outra frota Crabbox.

Flags úteis do smoke de desktop:

- `--lease-id <cbx_...>` ou `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reutiliza um desktop aquecido.
- `--browser-url <url>` altera a página aberta no navegador visível.
- `--html-file <path>` renderiza um artefato HTML local ao repo no navegador visível. Mantis usa isso para capturar a timeline de reação de status do Discord gerada por meio de um desktop Crabbox real.
- `--browser-profile-dir <remote-path>` reutiliza um user-data-dir remoto do Chrome para que um desktop Mantis persistente possa permanecer logado entre execuções. Use isso para o perfil de visualizador de longa duração do Discord Web.
- `--browser-profile-archive-env <name>` restaura um arquivo `.tgz` base64 de user-data-dir do Chrome a partir da variável de ambiente nomeada antes de iniciar o navegador. Use isso para testemunhas logadas, como Discord Web. A variável de ambiente padrão é `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` controla a duração da captura MP4. Use uma duração mais longa para apps web logados lentos que precisam de tempo para estabilizar.
- `--keep-lease` ou `OPENCLAW_MANTIS_KEEP_VM=1` mantém aberto um lease recém-criado e aprovado para inspeção por VNC. Execuções com falha mantêm o lease por padrão quando um foi criado, para que um operador possa reconectar.
- `--class`, `--idle-timeout` e `--ttl` ajustam o tamanho da máquina e a vida útil do lease.

Para evidência do Discord Web, Mantis usa uma conta de visualizador dedicada em vez de um
token de bot. O cenário da API Discord ao vivo continua sendo o oráculo: ele cria a thread real,
envia o `thread-reply` do SUT e verifica o anexo pela REST do Discord. Quando
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` está definido, o cenário também
grava um artefato de URL do Discord Web. Quando `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` está
definido, ele deixa essa thread disponível por tempo suficiente para um navegador logado abrir
e gravá-la.

O workflow do GitHub abre a URL da thread candidata no Discord Web, captura uma
captura de tela, grava um MP4 e gera uma prévia GIF recortada quando a ferramenta de mídia do Crabbox
está disponível. Prefira um caminho de perfil de visualizador persistente configurado
por meio de `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, porque arquivos completos de perfil do Chrome
podem ultrapassar o limite de tamanho de segredo do GitHub. Para perfis pequenos/de bootstrap,
o workflow também pode restaurar um arquivo `.tgz` base64 a partir de
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Se nenhuma fonte de perfil estiver
configurada, o workflow ainda publica as capturas de tela determinísticas de anexo
baseline/candidata e registra um aviso de que a testemunha logada do Discord Web
foi ignorada.

A primeira primitiva completa de transporte desktop é o smoke de desktop do Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ela aluga ou reutiliza uma máquina desktop Crabbox, sincroniza o checkout atual para
a VM, executa `pnpm openclaw qa slack` dentro dessa VM, abre o Slack Web no navegador
VNC, captura o desktop visível e copia tanto os artefatos de QA do Slack quanto
a captura de tela VNC de volta para o diretório de saída local. Esse é o primeiro formato Mantis
em que o Gateway OpenClaw SUT e o navegador vivem ambos dentro da mesma VM Linux desktop.

Com `--gateway-setup`, o comando prepara um home OpenClaw descartável persistente em
`$HOME/.openclaw-mantis/slack-openclaw`, ajusta a configuração do Slack Socket Mode
para o canal selecionado, inicia `openclaw gateway run` na porta
`38973` e mantém o Chrome em execução na sessão VNC. Esse é o modo "deixe-me um
desktop Linux com Slack e uma garra em execução"; a lane de QA Slack bot para bot
continua sendo o padrão quando `--gateway-setup` é omitido.

Entradas obrigatórias para `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para a lane de modelo remota. Se apenas
  `OPENAI_API_KEY` estiver definido localmente, Mantis o mapeia para `OPENCLAW_LIVE_OPENAI_KEY`
  antes de invocar o Crabbox, para que o encaminhamento de env `OPENCLAW_*` do Crabbox possa levá-lo
  para dentro da VM.

Com `--gateway-setup --credential-source convex`, Mantis aluga a credencial SUT do Slack
do pool compartilhado antes de criar a VM e encaminha o id do canal alugado, o token de app
Socket Mode e o token de bot como env de runtime `OPENCLAW_MANTIS_SLACK_*`
dentro do desktop. Isso mantém workflows do GitHub enxutos: eles só precisam
do segredo do broker Convex, não de tokens brutos de bot ou app do Slack.

Flags úteis de desktop do Slack:

- `--lease-id <cbx_...>` reexecuta contra uma máquina em que um operador já fez login no Slack Web por VNC.
- `--gateway-setup` inicia um Gateway OpenClaw Slack persistente na VM em vez de apenas executar a lane de QA bot para bot.
- `--keep-lease` mantém a VM do Gateway aberta para inspeção por VNC após sucesso; `--no-keep-lease` a interrompe depois de coletar artefatos.
- `--slack-url <url>` abre uma URL específica do Slack Web. Sem ela, Mantis deriva `https://app.slack.com/client/<team>/<channel>` a partir de `auth.test` do Slack quando o token do bot SUT está disponível.
- `--slack-channel-id <id>` controla a allowlist de canais Slack usada pela configuração do Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla o perfil persistente do Chrome dentro da VM. O padrão é `$HOME/.config/openclaw-mantis/slack-chrome-profile`, então um login manual no Slack Web sobrevive a reexecuções no mesmo lease.
- `--credential-source convex --credential-role ci` usa o pool compartilhado de credenciais em vez de tokens de env diretos do Slack.
- `--provider-mode`, `--model`, `--alt-model` e `--fast` são repassados para a lane ao vivo do Slack.

O workflow de smoke do GitHub é `Mantis Discord Smoke`. O workflow de antes e depois do GitHub
para o primeiro cenário real é `Mantis Discord Status Reactions`. Ele
aceita:

- `baseline_ref`: a ref esperada para reproduzir o comportamento apenas enfileirado.
- `candidate_ref`: a ref esperada para mostrar `queued -> thinking -> done`.

Ele faz checkout da ref do harness de workflow, compila worktrees separadas de baseline e candidata,
executa `discord-status-reactions-tool-only` contra cada worktree e
faz upload de `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md` como
artefatos do Actions. Ele também renderiza o HTML da timeline de cada lane em um navegador desktop
Crabbox e publica essas capturas de tela VNC ao lado dos PNGs determinísticos
da timeline no comentário do PR. O mesmo comentário de PR incorpora prévias GIF leves
recortadas por movimento geradas por `crabbox media preview`, vincula os clipes MP4
recortados por movimento correspondentes e mantém os arquivos MP4 completos do desktop para inspeção
profunda. As capturas de tela permanecem inline para revisão rápida. O workflow compila a
CLI do Crabbox a partir do main de
`openclaw/crabbox` para poder usar as flags atuais de lease desktop/navegador
antes que o próximo release binário do Crabbox seja publicado.

`Mantis Scenario` é o ponto de entrada manual genérico. Ele recebe um `scenario_id`,
`candidate_ref`, `baseline_ref` opcional e `pr_number` opcional, então
despacha o workflow de propriedade do cenário. O wrapper é intencionalmente fino:
workflows de cenário ainda são donos da configuração de transporte, credenciais, classe da VM,
oráculo esperado e manifesto de artefatos.

`Mantis Slack Desktop Smoke` é o primeiro workflow de VM do Slack. Ele faz checkout da ref candidata confiável em uma worktree separada, reserva um desktop Linux do Crabbox, executa `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` contra essa candidata, abre o Slack Web no navegador VNC, grava o desktop, gera uma prévia recortada por movimento com `crabbox media preview`, faz upload do diretório completo de artefatos e, opcionalmente, publica o comentário de evidência inline no PR de destino. O padrão é usar AWS para a reserva do desktop, e ele expõe uma entrada manual de provedor para que operadores possam alternar para Hetzner quando a capacidade da AWS estiver lenta ou indisponível. Use esta lane quando você quiser "um desktop Linux com Slack e uma claw em execução" em vez de apenas uma transcrição Slack de bot para bot.

Todo cenário que publica em PR grava `mantis-evidence.json` ao lado do respectivo relatório. Este schema é a passagem de controle entre o código do cenário e os comentários do GitHub:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

Os valores de `path` dos artefatos são relativos ao diretório do manifesto. Os valores de `targetPath` são caminhos relativos sob o diretório de publicação do branch `qa-artifacts`. O publicador rejeita travessia de caminhos e ignora entradas marcadas como `"required": false` quando prévias ou vídeos opcionais não estão disponíveis.

Tipos de artefato compatíveis:

- `timeline`: captura de tela determinística do cenário, geralmente antes/depois.
- `desktopScreenshot`: captura de tela do desktop VNC/navegador.
- `motionPreview`: GIF animado inline gerado a partir da gravação do desktop.
- `motionClip`: MP4 recortado por movimento que remove o início e o fim estáticos.
- `fullVideo`: gravação MP4 completa para inspeção detalhada.
- `metadata`: sidecar JSON/log.
- `report`: relatório em Markdown.

O publicador reutilizável é `scripts/mantis/publish-pr-evidence.mjs`. Workflows o chamam com o manifesto, o PR de destino, a raiz de destino de `qa-artifacts`, o marcador de comentário, a URL do artefato do Actions, a URL da execução e a origem da solicitação. Ele copia os artefatos declarados para o branch `qa-artifacts`, cria um comentário de PR com resumo primeiro, com imagens/prévias inline e vídeos vinculados, e então atualiza o comentário marcador existente ou cria um novo.

Você também pode acionar a execução de reações de status diretamente a partir de um comentário de PR:

```text
@Mantis discord status reactions
```

O gatilho por comentário é intencionalmente restrito. Ele só é executado em comentários de pull request de usuários com acesso de escrita, manutenção ou administração, e só reconhece solicitações de reação de status do Discord. Por padrão, ele usa a ref de baseline sabidamente ruim e o SHA atual da cabeça do PR como candidato. Mantenedores podem sobrescrever qualquer uma das refs:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Exemplos de comandos do ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

O primeiro comando é explícito e focado no cenário. O segundo pode, posteriormente, mapear um PR ou uma issue para cenários Mantis recomendados a partir de labels, arquivos alterados e achados de revisão do ClawSweeper.

## Ciclo de vida da execução

1. Obter credenciais.
2. Alocar ou reutilizar uma VM.
3. Preparar o perfil de desktop/navegador quando o cenário exigir evidência de UI.
4. Preparar um checkout limpo para a ref de baseline.
5. Instalar dependências e compilar apenas o que o cenário precisa.
6. Iniciar um Gateway OpenClaw filho com um diretório de estado isolado.
7. Configurar o transporte live, o provedor, o modelo e o perfil do navegador.
8. Executar o cenário e capturar evidência de baseline.
9. Parar o Gateway e preservar logs.
10. Preparar a ref candidata na mesma VM.
11. Executar o mesmo cenário e capturar evidência da candidata.
12. Comparar os resultados do oráculo e a evidência visual.
13. Gravar Markdown, JSON, logs, capturas de tela e artefatos opcionais de rastreamento.
14. Fazer upload de artefatos do GitHub Actions.
15. Publicar uma mensagem concisa de status no PR ou no Discord.

O cenário deve poder falhar de duas maneiras diferentes:

- **Bug reproduzido**: a baseline falhou da forma esperada.
- **Falha do harness**: a configuração do ambiente, as credenciais, a API do Discord, o navegador ou o provedor falharam antes de o oráculo do bug ser significativo.

O relatório final deve separar esses casos para que os mantenedores não confundam um ambiente instável com comportamento do produto.

## MVP do Discord

O primeiro cenário deve mirar reações de status do Discord em canais de guilda onde o modo de entrega de resposta de origem é `message_tool_only`.

Por que ele é uma boa semente Mantis:

- É visível no Discord como reações na mensagem que disparou o fluxo.
- Tem um oráculo REST forte por meio do estado de reação da mensagem do Discord.
- Exercita um Gateway OpenClaw real, autenticação de bot do Discord, despacho de mensagens, modo de entrega de resposta de origem, estado de reação de status e ciclo de vida de turno do modelo.
- É restrito o bastante para manter a primeira implementação honesta.

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

A evidência da baseline deve mostrar a reação de confirmação enfileirada, mas nenhuma transição de ciclo de vida no modo somente ferramenta. A evidência da candidata deve mostrar reações de status de ciclo de vida em execução quando `messages.statusReactions.enabled` está explicitamente `true`.

A primeira fatia executável é o cenário opt-in de QA live do Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Ele configura o SUT com tratamento de guildas sempre ativo, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` e reações de status explícitas. O oráculo consulta a mensagem real do Discord que disparou o fluxo e espera a sequência observada `👀 -> 🤔 -> 👍`. Os artefatos incluem `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` e `discord-status-reactions-tool-only-timeline.png`.

## Peças de QA existentes

O Mantis deve se basear na pilha privada de QA existente em vez de começar do zero:

- `pnpm openclaw qa discord` já executa uma lane live do Discord com bots driver e SUT.
- O executor de transporte live já grava relatórios e artefatos de mensagens observadas em `.artifacts/qa-e2e/`.
- Reservas de credenciais do Convex já fornecem acesso exclusivo a credenciais compartilhadas de transporte live.
- O serviço de controle de navegador já oferece suporte a capturas de tela, snapshots, perfis gerenciados headless e perfis CDP remotos.
- O QA Lab já tem uma UI de depurador e um barramento para testes no formato de transporte.

A primeira implementação do Mantis pode ser um executor fino de antes/depois sobre essas peças, além de uma camada de evidência visual.

## Modelo de evidência

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

`mantis-summary.json` deve ser a fonte da verdade legível por máquina. O relatório Markdown é para comentários de PR e revisão humana.

O resumo deve incluir:

- refs e SHAs testados
- transporte e id do cenário
- provedor da máquina e id da máquina ou id da reserva
- origem das credenciais sem valores secretos
- resultado da baseline
- resultado da candidata
- se o bug foi reproduzido na baseline
- se a candidata o corrigiu
- caminhos dos artefatos
- problemas de configuração ou limpeza sanitizados

Capturas de tela são evidência, não segredos. Ainda assim, elas exigem disciplina de redação: nomes de canais privados, nomes de usuários ou conteúdo de mensagens podem aparecer. Para PRs públicos, prefira links de artefatos do GitHub Actions a imagens inline até que a história de redação esteja mais forte.

## Navegador e VNC

A lane de navegador tem dois modos:

- **Automação headless**: padrão para CI. O Chrome é executado com CDP habilitado, e o Playwright ou o controle de navegador do OpenClaw captura telas.
- **Resgate por VNC**: habilitado na mesma VM quando login, MFA, antiautomação do Discord ou depuração visual precisam de um humano.

O perfil do navegador observador do Discord deve ser persistente o bastante para evitar login a cada execução, mas isolado do estado pessoal do navegador. Um perfil pertence ao pool de máquinas Mantis, não a um laptop de desenvolvedor.

Quando o Mantis fica travado, ele publica uma mensagem de status no Discord com:

- id da execução
- id do cenário
- provedor da máquina
- diretório de artefatos
- instruções de conexão VNC ou noVNC, se disponíveis
- texto curto do bloqueador

A primeira implantação privada pode publicar essas mensagens no canal de operadores existente e migrar para um canal Mantis dedicado depois.

## Máquinas

O Mantis deve preferir AWS por meio do Crabbox para a primeira implementação remota. O Crabbox nos fornece máquinas aquecidas, rastreamento de reservas, hidratação, logs, resultados e limpeza. Se a capacidade da AWS estiver lenta demais ou indisponível, adicione um provedor Hetzner atrás da mesma interface de máquina.

Requisitos mínimos da VM:

- Linux com instalação de Chrome ou Chromium compatível com desktop
- acesso CDP para automação de navegador
- VNC ou noVNC para resgate
- Node 22 e pnpm
- checkout do OpenClaw e cache de dependências
- cache do navegador Chromium do Playwright quando Playwright for usado
- CPU e memória suficientes para um Gateway OpenClaw, um navegador e uma execução de modelo
- acesso de saída ao Discord, GitHub, provedores de modelo e broker de credenciais

A VM não deve manter segredos brutos de longa duração fora dos armazenamentos esperados de credenciais ou perfis de navegador.

## Segredos

Segredos ficam em segredos de organização ou repositório do GitHub para execuções remotas, e em um arquivo local de segredos controlado pelo operador para execuções locais.

Nomes de segredo recomendados:

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

No longo prazo, o pool de credenciais do Convex deve continuar sendo a origem normal para credenciais de transporte live. Segredos do GitHub inicializam o broker e as lanes de fallback. O workflow de reações de status do Discord mapeia os segredos Mantis Crabbox de volta para as variáveis de ambiente `CRABBOX_COORDINATOR` e `CRABBOX_COORDINATOR_TOKEN` esperadas pela CLI do Crabbox. Os nomes simples de segredos do GitHub `CRABBOX_*` continuam aceitos como fallback de compatibilidade.

O executor do Mantis nunca deve imprimir:

- tokens de bot do Discord
- chaves de API de provedor
- cookies de navegador
- conteúdo de perfis de autenticação
- senhas VNC
- payloads brutos de credenciais

Uploads públicos de artefatos também devem redigir metadados de destino do Discord, como ids de bot, guilda, canal e mensagem. O workflow de smoke do GitHub habilita `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` por esse motivo.

Se um token for acidentalmente colado em uma issue, PR, chat ou log, rotacione-o depois que o novo segredo tiver sido armazenado.

## Artefatos do GitHub e comentários em PR

Os fluxos de trabalho do Mantis devem enviar o pacote completo de evidências como um artefato de curta duração do Actions. Quando o fluxo de trabalho for executado para um relatório de bug ou PR de correção, ele também deve publicar as capturas de tela PNG editadas no branch `qa-artifacts` e fazer upsert de um comentário nesse bug ou PR de correção com capturas de tela antes/depois embutidas. Não publique a prova principal apenas em um PR genérico de automação de QA. Logs brutos, mensagens observadas e outras evidências volumosas ficam no artefato do Actions.

Fluxos de trabalho de produção devem publicar esses comentários com o Mantis GitHub App, não com `github-actions[bot]`. Armazene o id do app e a chave privada como secrets do GitHub Actions `MANTIS_GITHUB_APP_ID` e `MANTIS_GITHUB_APP_PRIVATE_KEY`. O fluxo de trabalho usa um marcador oculto como chave de upsert, atualiza esse comentário quando o token pode editá-lo e cria um novo comentário de propriedade do Mantis quando um marcador mais antigo de propriedade do bot não pode ser editado.

O comentário do PR deve ser curto e visual:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Quando a execução falhar porque o harness falhou, o comentário deve dizer isso em vez de insinuar que o candidato falhou.

## Observações de implantação privada

Uma implantação privada talvez já tenha uma aplicação Mantis Discord. Reutilize essa aplicação em vez de criar outro app quando ela tiver as permissões de bot corretas e puder ser rotacionada com segurança.

Defina o canal inicial de notificação do operador por meio de secrets ou configuração de implantação. Ele pode apontar primeiro para um canal existente de manutenção ou operações e depois mudar para um canal dedicado ao Mantis quando houver um.

Não coloque ids de guilda, ids de canal, tokens de bot, cookies de navegador ou senhas de VNC neste documento. Armazene-os em secrets do GitHub, no broker de credenciais ou no armazenamento local de secrets do operador.

## Adicionar um cenário

Um cenário do Mantis deve declarar:

- id e título
- transporte
- credenciais necessárias
- política de ref de baseline
- política de ref de candidato
- patch de configuração do OpenClaw
- etapas de setup
- estímulo
- oráculo de baseline esperado
- oráculo de candidato esperado
- alvos de captura visual
- orçamento de timeout
- etapas de limpeza

Os cenários devem preferir oráculos pequenos e tipados:

- estado de reação do Discord para bugs de reação
- referências de mensagens do Discord para bugs de encadeamento
- ts de thread do Slack e estado da API de reação para bugs do Slack
- ids e cabeçalhos de mensagens de email para bugs de email
- capturas de tela do navegador quando a UI for o único observável confiável

Verificações de visão devem ser aditivas. Se uma API de plataforma puder provar o bug, use a API como o oráculo de aprovação/falha e mantenha capturas de tela para confiança humana.

## Expansão de provedores

Depois do Discord, o mesmo executor pode adicionar:

- Slack: reações, threads, menções ao app, modais, uploads de arquivos.
- Email: autenticação do Gmail e encadeamento de mensagens usando `gog` quando os conectores não forem suficientes.
- WhatsApp: login por QR, reidentificação, entrega de mensagens, mídia, reações.
- Telegram: bloqueio por menção em grupo, comandos, reações onde disponíveis.
- Matrix: salas criptografadas, relações de thread ou resposta, retomada após reinício.

Cada transporte deve ter um cenário smoke barato e um ou mais cenários por classe de bug. Cenários visuais caros devem continuar opt-in.

## Perguntas em aberto

- Qual bot do Discord deve ser o driver, e qual deve ser o SUT, quando o bot Mantis existente for reutilizado?
- O login do navegador observador deve usar uma conta humana do Discord, uma conta de teste ou apenas evidência REST legível por bot na primeira fase?
- Por quanto tempo o GitHub deve reter artefatos do Mantis para PRs?
- Quando o ClawSweeper deve recomendar automaticamente o Mantis em vez de esperar um comando de mantenedor?
- As capturas de tela devem ser editadas ou recortadas antes do upload para PRs públicos?
