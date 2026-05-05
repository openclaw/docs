---
read_when:
    - Criar ou executar QA visual ao vivo para bugs do OpenClaw
    - Adicionando verificação antes e depois para uma solicitação pull
    - Adicionando cenários de transporte ao vivo do Discord, Slack, WhatsApp ou outros
    - Depuração de execuções de QA que precisam de capturas de tela, automação de navegador ou acesso VNC
summary: Mantis é o sistema visual de verificação de ponta a ponta para reproduzir bugs do OpenClaw em transportes ao vivo, capturar evidências de antes e depois e anexar artefatos a PRs.
title: Louva-a-deus
x-i18n:
    generated_at: "2026-05-05T08:25:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis é o sistema de verificação de ponta a ponta do OpenClaw para bugs que precisam de um
tempo de execução real, um transporte real e prova visível. Ele executa um cenário contra uma ref
sabidamente ruim, captura evidências, executa o mesmo cenário contra uma ref candidata e
publica a comparação como artefatos que um mantenedor pode inspecionar a partir de um PR ou
de um comando local.

Mantis começa com Discord porque Discord nos dá uma primeira faixa de alto valor:
autenticação real de bot, canais reais de guilda, reações, threads, comandos nativos e uma
UI de navegador em que humanos podem confirmar visualmente o que o transporte mostrou.

## Objetivos

- Reproduzir um bug de uma issue ou PR do GitHub com o mesmo formato de transporte que os usuários
  veem.
- Capturar um artefato de **antes** na ref de linha de base antes de aplicar a correção.
- Capturar um artefato de **depois** na ref candidata depois de aplicar a correção.
- Usar um oráculo determinístico sempre que possível, como uma leitura de reação via REST do Discord
  ou verificação de transcrição de canal.
- Capturar capturas de tela quando o bug tiver uma superfície de UI visível.
- Executar localmente a partir de uma CLI controlada por agente e remotamente a partir do GitHub.
- Preservar estado de máquina suficiente para resgate por VNC quando login, automação de navegador ou
  autenticação de provedor travar.
- Publicar status conciso em um canal Discord de operador quando a execução estiver bloqueada,
  precisar de ajuda manual via VNC ou terminar.

## Não objetivos

- Mantis não é um substituto para testes unitários. Uma execução do Mantis normalmente deve se tornar
  um teste de regressão menor depois que a correção for entendida.
- Mantis não é o gate rápido normal de CI. Ele é mais lento, usa credenciais ao vivo e
  é reservado para bugs em que o ambiente ao vivo importa.
- Mantis não deve exigir um humano para operação normal. VNC manual é um caminho de resgate,
  não o caminho esperado.
- Mantis não armazena segredos brutos em artefatos, logs, capturas de tela, relatórios Markdown
  ou comentários de PR.

## Propriedade

Mantis vive na pilha de QA do OpenClaw.

- OpenClaw é dono do tempo de execução de cenários, adaptadores de transporte, esquema de evidências e
  CLI local em `pnpm openclaw qa mantis`.
- QA Lab é dono das partes do harness de transporte ao vivo, helpers de captura de navegador e
  gravadores de artefatos.
- Crabbox é dono das máquinas Linux aquecidas quando uma VM remota é necessária.
- GitHub Actions é dono do ponto de entrada do workflow remoto e da retenção de artefatos.
- ClawSweeper é dono do roteamento de comentários do GitHub: analisar comandos de mantenedores,
  disparar o workflow e publicar o comentário final no PR.
- Agentes OpenClaw conduzem o Mantis por meio do Codex quando um cenário precisa de configuração agêntica,
  depuração ou relatório de estado travado.

Esse limite mantém o conhecimento de transporte no OpenClaw, o agendamento de máquinas no
Crabbox e a cola de workflow de mantenedores no ClawSweeper.

## Formato do comando

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

O executor cria worktrees destacadas de linha de base e candidata sob o diretório de saída,
instala dependências, compila cada ref, executa o cenário com
`--allow-failures` e então grava `baseline/`, `candidate/`, `comparison.json`
e `mantis-report.md`. Para o primeiro cenário do Discord, uma verificação bem-sucedida
significa que o status da linha de base é `fail` e o status da candidata é `pass`.

O primeiro primitivo de VM/navegador é o smoke de desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Ele aluga ou reutiliza uma máquina desktop do Crabbox, inicia um navegador visível dentro da
sessão VNC, captura o desktop, traz os artefatos de volta para o diretório de saída local
e grava o comando de reconexão no relatório. O comando usa por padrão o provedor Hetzner
porque ele é o primeiro provedor com cobertura funcional de desktop/VNC na faixa do Mantis.
Substitua-o com `--provider`, `--crabbox-bin` ou
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` ao executar contra outra frota Crabbox.

Flags úteis de smoke de desktop:

- `--lease-id <cbx_...>` ou `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reutiliza um desktop aquecido.
- `--browser-url <url>` altera a página aberta no navegador visível.
- `--html-file <path>` renderiza um artefato HTML local do repositório no navegador visível. Mantis usa isso para capturar a linha do tempo gerada de reações de status do Discord por meio de um desktop Crabbox real.
- `--keep-lease` ou `OPENCLAW_MANTIS_KEEP_VM=1` mantém aberto um aluguel recém-criado e aprovado para inspeção por VNC. Execuções com falha mantêm o aluguel por padrão quando um foi criado, para que um operador possa reconectar.
- `--class`, `--idle-timeout` e `--ttl` ajustam o tamanho da máquina e a vida útil do aluguel.

O primeiro primitivo completo de transporte em desktop é o smoke de desktop do Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ele aluga ou reutiliza uma máquina desktop do Crabbox, sincroniza o checkout atual para
a VM, executa `pnpm openclaw qa slack` dentro dessa VM, abre Slack Web no navegador VNC,
captura o desktop visível e copia tanto os artefatos de QA do Slack quanto
a captura de tela VNC de volta para o diretório de saída local. Esse é o primeiro formato do Mantis
em que o Gateway OpenClaw do SUT e o navegador vivem ambos dentro da mesma
VM desktop Linux.

Com `--gateway-setup`, o comando prepara uma home OpenClaw descartável persistente
em `$HOME/.openclaw-mantis/slack-openclaw`, aplica patches na configuração do Slack Socket Mode
para o canal selecionado, inicia `openclaw gateway run` na porta
`38973` e mantém o Chrome em execução na sessão VNC. Esse é o modo "deixe-me com um
desktop Linux com Slack e um claw em execução"; a faixa de QA Slack bot-a-bot
continua sendo o padrão quando `--gateway-setup` é omitido.

Entradas obrigatórias para `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` para a faixa de modelo remoto. Se apenas
  `OPENAI_API_KEY` estiver definido localmente, Mantis o mapeia para `OPENCLAW_LIVE_OPENAI_KEY`
  antes de invocar o Crabbox para que o encaminhamento de env `OPENCLAW_*` do Crabbox possa levá-lo
  para dentro da VM.

Flags úteis de desktop do Slack:

- `--lease-id <cbx_...>` executa novamente contra uma máquina em que um operador já fez login no Slack Web por VNC.
- `--gateway-setup` inicia um Gateway Slack persistente do OpenClaw na VM em vez de apenas executar a faixa de QA bot-a-bot.
- `--slack-url <url>` abre uma URL específica do Slack Web. Sem ela, Mantis deriva `https://app.slack.com/client/<team>/<channel>` de `auth.test` do Slack quando o token do bot SUT está disponível.
- `--slack-channel-id <id>` controla a lista de permissões de canais Slack usada pela configuração do Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controla o perfil persistente do Chrome dentro da VM. O padrão é `$HOME/.config/openclaw-mantis/slack-chrome-profile`, então um login manual no Slack Web sobrevive a novas execuções no mesmo aluguel.
- `--credential-source convex --credential-role ci` usa o pool compartilhado de credenciais em vez de tokens de env diretos do Slack.
- `--provider-mode`, `--model`, `--alt-model` e `--fast` são repassados para a faixa ao vivo do Slack.

O workflow de smoke do GitHub é `Mantis Discord Smoke`. O workflow de antes e depois do GitHub
para o primeiro cenário real é `Mantis Discord Status Reactions`. Ele
aceita:

- `baseline_ref`: a ref que deve reproduzir o comportamento apenas enfileirado.
- `candidate_ref`: a ref que deve mostrar `queued -> thinking -> done`.

Ele faz checkout da ref do harness de workflow, compila worktrees separadas de linha de base e candidata,
executa `discord-status-reactions-tool-only` contra cada worktree e
envia `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md` como
artefatos do Actions. Ele também renderiza o HTML da linha do tempo de cada faixa em um navegador
desktop Crabbox e publica essas capturas de tela VNC ao lado dos PNGs determinísticos
da linha do tempo no comentário do PR. O mesmo comentário do PR incorpora prévias GIF leves
com movimento aparado geradas por `crabbox media preview`, vincula aos
clipes MP4 correspondentes com movimento aparado e mantém os arquivos MP4 completos de desktop para
inspeção profunda. As capturas de tela permanecem inline para revisão rápida. O workflow compila a
CLI do Crabbox a partir de
`openclaw/crabbox` main para poder usar as flags atuais de aluguel desktop/navegador
antes que a próxima versão binária do Crabbox seja lançada.

`Mantis Scenario` é o ponto de entrada manual genérico. Ele recebe um `scenario_id`,
`candidate_ref`, `baseline_ref` opcional e `pr_number` opcional, então
dispara o workflow pertencente ao cenário. O wrapper é intencionalmente fino:
os workflows de cenário ainda são donos da configuração de transporte, credenciais, classe da VM,
oráculo esperado e manifesto de artefatos.

`Mantis Slack Desktop Smoke` é o primeiro workflow de VM do Slack. Ele faz checkout da
ref candidata confiável em uma worktree separada, aluga um desktop Linux do Crabbox,
executa `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` contra essa
candidata, abre Slack Web no navegador VNC, grava o desktop, gera uma
prévia com movimento aparado com `crabbox media preview`, envia o diretório completo de artefatos
e, opcionalmente, publica o comentário de evidências inline no PR alvo.
Use esta faixa quando você quiser "um desktop Linux com Slack e um claw em execução"
em vez de apenas uma transcrição Slack bot-a-bot.

Todo cenário que publica em PR grava `mantis-evidence.json` ao lado do relatório.
Esse esquema é a passagem de bastão entre o código de cenário e os comentários do GitHub:

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

Valores de `path` de artefato são relativos ao diretório do manifesto. Valores de `targetPath`
são caminhos relativos sob o diretório de publicação do branch `qa-artifacts`.
O publicador rejeita path traversal e ignora entradas marcadas como
`"required": false` quando prévias ou vídeos opcionais estão indisponíveis.

Tipos de artefato aceitos:

- `timeline`: captura de tela determinística do cenário, normalmente antes/depois.
- `desktopScreenshot`: captura de tela do desktop VNC/navegador.
- `motionPreview`: GIF animado inline gerado a partir da gravação do desktop.
- `motionClip`: MP4 com movimento aparado que remove início e fim estáticos.
- `fullVideo`: gravação MP4 completa para inspeção profunda.
- `metadata`: sidecar JSON/log.
- `report`: relatório Markdown.

O publicador reutilizável é `scripts/mantis/publish-pr-evidence.mjs`. Workflows
o chamam com o manifesto, PR alvo, raiz alvo de `qa-artifacts`, marcador de comentário,
URL do artefato do Actions, URL da execução e origem da solicitação. Ele copia os artefatos declarados
para o branch `qa-artifacts`, constrói um comentário de PR com resumo primeiro, com imagens/prévias
inline e vídeos vinculados, então atualiza o comentário de marcador existente ou
cria um novo.

Você também pode disparar a execução de reações de status diretamente a partir de um comentário de PR:

```text
@Mantis discord status reactions
```

O gatilho de comentário é intencionalmente restrito. Ele só executa em comentários de pull request
de usuários com acesso de gravação, manutenção ou administração, e só reconhece
solicitações de reações de status do Discord. Por padrão, ele usa a ref de linha de base sabidamente ruim
e o SHA atual do cabeçalho do PR como candidata. Mantenedores podem substituir qualquer uma das
refs:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Exemplos de comandos do ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

O primeiro comando é explícito e focado no cenário. O segundo pode, mais tarde, mapear um PR
ou issue para cenários Mantis recomendados com base em rótulos, arquivos alterados e
achados da revisão do ClawSweeper.

## Ciclo de vida da execução

1. Obter credenciais.
2. Alocar ou reutilizar uma VM.
3. Preparar o perfil de desktop/navegador quando o cenário precisar de evidência de UI.
4. Preparar um checkout limpo para a ref de baseline.
5. Instalar dependências e compilar apenas o que o cenário precisa.
6. Iniciar um Gateway OpenClaw filho com um diretório de estado isolado.
7. Configurar o transporte ao vivo, o provedor, o modelo e o perfil do navegador.
8. Executar o cenário e capturar evidências de baseline.
9. Parar o gateway e preservar logs.
10. Preparar a ref candidata na mesma VM.
11. Executar o mesmo cenário e capturar evidências da candidata.
12. Comparar os resultados do oráculo e as evidências visuais.
13. Escrever Markdown, JSON, logs, capturas de tela e artefatos de rastreamento opcionais.
14. Enviar artefatos do GitHub Actions.
15. Publicar uma mensagem de status concisa no PR ou no Discord.

O cenário deve poder falhar de duas formas diferentes:

- **Bug reproduzido**: o baseline falhou da forma esperada.
- **Falha do harness**: configuração do ambiente, credenciais, API do Discord, navegador ou
  provedor falhou antes que o oráculo do bug fosse significativo.

O relatório final deve separar esses casos para que mantenedores não confundam um ambiente
instável com comportamento do produto.

## MVP do Discord

O primeiro cenário deve mirar reações de status do Discord em canais de guilda nos quais
o modo de entrega da resposta de origem é `message_tool_only`.

Por que ele é uma boa semente para o Mantis:

- É visível no Discord como reações na mensagem acionadora.
- Tem um oráculo REST forte por meio do estado de reação da mensagem no Discord.
- Exercita um Gateway OpenClaw real, autenticação de bot do Discord, despacho de mensagens,
  modo de entrega de resposta de origem, estado de reação de status e ciclo de vida do turno do modelo.
- É restrito o suficiente para manter a primeira implementação honesta.

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

As evidências de baseline devem mostrar a reação de confirmação enfileirada, mas nenhuma
transição de ciclo de vida no modo apenas ferramenta. As evidências da candidata devem mostrar reações de status
do ciclo de vida em execução quando `messages.statusReactions.enabled` está explicitamente
true.

A primeira fatia executável é o cenário de QA ao vivo do Discord com opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Ele configura o SUT com tratamento de guilda sempre ativo, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` e reações de status explícitas. O oráculo
consulta a mensagem acionadora real do Discord e espera a sequência observada
`👀 -> 🤔 -> 👍`. Os artefatos incluem `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` e
`discord-status-reactions-tool-only-timeline.png`.

## Componentes de QA existentes

O Mantis deve se basear na pilha privada de QA existente em vez de começar do
zero:

- `pnpm openclaw qa discord` já executa uma lane ao vivo do Discord com bots driver e
  SUT.
- O executor de transporte ao vivo já grava relatórios e artefatos de mensagens observadas
  em `.artifacts/qa-e2e/`.
- Os leases de credenciais do Convex já fornecem acesso exclusivo a credenciais compartilhadas de transporte
  ao vivo.
- O serviço de controle de navegador já dá suporte a capturas de tela, snapshots,
  perfis gerenciados headless e perfis CDP remotos.
- O QA Lab já tem uma UI de depuração e um bus para testes com formato de transporte.

A primeira implementação do Mantis pode ser um executor antes/depois fino sobre esses
componentes, mais uma camada de evidência visual.

## Modelo de evidências

Toda execução grava um diretório de artefatos estável:

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
relatório Markdown é para comentários em PRs e revisão humana.

O resumo deve incluir:

- refs e SHAs testados
- transporte e id do cenário
- provedor de máquina e id da máquina ou id do lease
- origem das credenciais sem valores secretos
- resultado do baseline
- resultado da candidata
- se o bug foi reproduzido no baseline
- se a candidata corrigiu o bug
- caminhos dos artefatos
- problemas de configuração ou limpeza sanitizados

Capturas de tela são evidências, não segredos. Elas ainda precisam de disciplina de redação:
nomes de canais privados, nomes de usuários ou conteúdo de mensagens podem aparecer. Para PRs públicos,
prefira links de artefatos do GitHub Actions em vez de imagens inline até que a história de redação
esteja mais forte.

## Navegador e VNC

A lane de navegador tem dois modos:

- **Automação headless**: padrão para CI. O Chrome roda com CDP habilitado, e
  Playwright ou o controle de navegador do OpenClaw captura capturas de tela.
- **Resgate por VNC**: habilitado na mesma VM quando login, MFA, anti-automação do Discord
  ou depuração visual precisam de uma pessoa.

O perfil de navegador observador do Discord deve ser persistente o suficiente para evitar
login a cada execução, mas isolado do estado pessoal do navegador. Um perfil
pertence ao pool de máquinas do Mantis, não ao laptop de um desenvolvedor.

Quando o Mantis fica travado, ele publica uma mensagem de status no Discord com:

- id da execução
- id do cenário
- provedor de máquina
- diretório de artefatos
- instruções de conexão VNC ou noVNC, se disponíveis
- breve texto do bloqueador

A primeira implantação privada pode publicar essas mensagens no canal de operadores
existente e migrar para um canal Mantis dedicado depois.

## Máquinas

O Mantis deve preferir AWS por meio do Crabbox para a primeira implementação remota.
O Crabbox nos dá máquinas aquecidas, rastreamento de leases, hidratação, logs, resultados e
limpeza. Se a capacidade da AWS estiver lenta demais ou indisponível, adicione um provedor Hetzner
atrás da mesma interface de máquina.

Requisitos mínimos de VM:

- Linux com uma instalação do Chrome ou Chromium capaz de desktop
- acesso CDP para automação de navegador
- VNC ou noVNC para resgate
- Node 22 e pnpm
- checkout do OpenClaw e cache de dependências
- cache do navegador Chromium do Playwright quando Playwright for usado
- CPU e memória suficientes para um Gateway OpenClaw, um navegador e uma execução de modelo
- acesso de saída ao Discord, GitHub, provedores de modelo e broker de credenciais

A VM não deve manter segredos brutos de longa duração fora dos armazenamentos esperados de credenciais ou
perfis de navegador.

## Segredos

Segredos ficam em segredos de organização ou repositório do GitHub para execuções remotas, e em
um arquivo de segredos local controlado pelo operador para execuções locais.

Nomes de segredos recomendados:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para envios públicos de artefatos do GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

A longo prazo, o pool de credenciais do Convex deve continuar sendo a origem normal para credenciais de transporte
ao vivo. Segredos do GitHub inicializam o broker e as lanes de fallback.
O workflow de reações de status do Discord mapeia os segredos Mantis Crabbox de volta para
as variáveis de ambiente `CRABBOX_COORDINATOR` e `CRABBOX_COORDINATOR_TOKEN`
que a CLI do Crabbox espera. Os nomes simples de segredos GitHub `CRABBOX_*` permanecem
aceitos como fallback de compatibilidade.

O executor Mantis nunca deve imprimir:

- tokens de bot do Discord
- chaves de API de provedor
- cookies de navegador
- conteúdo de perfis de autenticação
- senhas VNC
- payloads brutos de credenciais

Envios públicos de artefatos também devem redigir metadados de destino do Discord, como ids de bot,
guilda, canal e mensagem. O workflow smoke do GitHub habilita
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` por esse motivo.

Se um token for acidentalmente colado em uma issue, PR, chat ou log, rotacione-o
depois que o novo segredo tiver sido armazenado.

## Artefatos do GitHub e comentários em PRs

Workflows do Mantis devem enviar o pacote completo de evidências como um artefato de Actions
de curta duração. Quando o workflow for executado para um relatório de bug ou PR de correção, ele também deve
publicar as capturas de tela PNG redigidas no branch `qa-artifacts` e fazer upsert de um
comentário nesse bug ou PR de correção com capturas de tela antes/depois inline. Não publique
a prova principal apenas em um PR genérico de automação de QA. Logs brutos, mensagens observadas
e outras evidências volumosas ficam no artefato de Actions.

Workflows de produção devem publicar esses comentários com o GitHub App do Mantis, não
com `github-actions[bot]`. Armazene o app id e a chave privada como segredos do GitHub Actions
`MANTIS_GITHUB_APP_ID` e `MANTIS_GITHUB_APP_PRIVATE_KEY`. O workflow usa um marcador oculto como chave de upsert, atualiza esse
comentário quando o token pode editá-lo e cria um novo comentário pertencente ao Mantis quando
um marcador antigo pertencente ao bot não pode ser editado.

O comentário no PR deve ser curto e visual:

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

Quando a execução falha porque o harness falhou, o comentário deve dizer isso em vez
de sugerir que a candidata falhou.

## Observações de implantação privada

Uma implantação privada pode já ter uma aplicação Discord do Mantis. Reutilize essa
aplicação em vez de criar outro app quando ela tiver as permissões de bot corretas
e puder ser rotacionada com segurança.

Defina o canal inicial de notificação de operadores por meio de segredos ou configuração de implantação.
Ele pode apontar primeiro para um canal existente de mantenedores ou operações,
depois migrar para um canal Mantis dedicado quando um existir.

Não coloque ids de guilda, ids de canal, tokens de bot, cookies de navegador ou senhas VNC
neste documento. Armazene-os em segredos do GitHub, no broker de credenciais ou no
armazenamento local de segredos do operador.

## Adicionando um cenário

Um cenário Mantis deve declarar:

- id e título
- transporte
- credenciais obrigatórias
- política de ref de baseline
- política de ref candidata
- patch de configuração do OpenClaw
- etapas de configuração
- estímulo
- oráculo esperado do baseline
- oráculo esperado da candidata
- alvos de captura visual
- orçamento de timeout
- etapas de limpeza

Cenários devem preferir oráculos pequenos e tipados:

- estado de reação do Discord para bugs de reação
- referências de mensagem do Discord para bugs de threading
- ts de thread do Slack e estado da API de reação para bugs do Slack
- ids e cabeçalhos de mensagem de email para bugs de email
- capturas de tela do navegador quando a UI for o único observável confiável

Verificações por visão devem ser aditivas. Se uma API de plataforma puder provar o bug, use a
API como o oráculo passa/falha e mantenha capturas de tela para confiança humana.

## Expansão de provedores

Depois do Discord, o mesmo executor pode adicionar:

- Slack: reações, conversas encadeadas, menções ao app, modais, envios de arquivos.
- Email: autenticação do Gmail e encadeamento de mensagens usando `gog` quando os conectores não são
  suficientes.
- WhatsApp: login por QR, reidentificação, entrega de mensagens, mídia, reações.
- Telegram: controle de menções em grupos, comandos, reações quando disponíveis.
- Matrix: salas criptografadas, relações de conversa encadeada ou resposta, retomada após reinicialização.

Cada transporte deve ter um cenário smoke barato e um ou mais cenários por classe de
bug. Cenários visuais caros devem permanecer opcionais.

## Perguntas em Aberto

- Qual bot do Discord deve ser o driver e qual deve ser o SUT quando o
  bot Mantis existente for reutilizado?
- O login do navegador observador deve usar uma conta humana do Discord, uma conta de teste
  ou apenas evidências REST legíveis por bot na primeira fase?
- Por quanto tempo o GitHub deve reter artefatos do Mantis para PRs?
- Quando o ClawSweeper deve recomendar automaticamente o Mantis em vez de esperar por um
  comando de maintainer?
- As capturas de tela devem ser redigidas ou cortadas antes do upload para PRs públicos?
