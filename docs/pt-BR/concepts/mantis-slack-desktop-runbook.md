---
read_when:
    - Executando o QA do aplicativo Slack para desktop com o Mantis pelo GitHub ou localmente
    - Depuração de execuções lentas do Mantis no aplicativo Slack para desktop
    - Escolha entre os modos de origem, pré-hidratado ou de concessão ativa
    - Publicação de evidências em capturas de tela e vídeos em um PR
summary: 'Guia operacional para QA do Mantis no aplicativo Slack para desktop: acionamento pelo GitHub, CLI local, concessões VNC aquecidas, modos de hidratação, interpretação de tempos, artefatos e tratamento de falhas.'
title: Guia operacional do Mantis para o Slack Desktop
x-i18n:
    generated_at: "2026-07-11T23:52:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

O QA de desktop do Slack no Mantis é a trilha de interface real para bugs da classe do Slack que precisam de um
desktop Linux, recuperação por VNC, Slack Web, um Gateway real do OpenClaw, capturas de tela,
vídeos e um comentário de evidências no PR. Use-o quando testes unitários ou a trilha live
sem interface gráfica do Slack não puderem comprovar o bug.

## Modelo de armazenamento

O Mantis usa três camadas de armazenamento:

- **Imagem do provedor** - gerenciada pelo Crabbox, armazenada na conta do provedor de nuvem.
  Contém recursos da máquina (Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, ferramentas de compilação nativas) e diretórios de cache vazios.
- **Estado da concessão aquecida** - gerenciado pela sessão atual do operador. Pode conter um
  perfil de navegador autenticado, `/var/cache/crabbox/pnpm` e um checkout do código-fonte
  preparado enquanto a concessão estiver ativa.
- **Artefatos do Mantis** - gerenciados pela execução do OpenClaw. Ficam em
  `.artifacts/qa-e2e/mantis/...`; o GitHub Actions os envia, e o aplicativo do Mantis
  para GitHub publica as evidências em linha no PR.

Nunca incorpore segredos, cookies do navegador, estado de login do Slack, checkouts do repositório,
`node_modules` ou `dist/` em uma imagem do provedor.

## Disparo pelo GitHub

Execute o fluxo de trabalho a partir de `main`:

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

`candidate_ref` é restrito porque o fluxo de trabalho usa credenciais reais: ele
deve ser resolvido para um ancestral da `main` atual, uma tag de versão ou o HEAD de um PR aberto em
`openclaw/openclaw`.

O fluxo de trabalho produz:

- o artefato enviado `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- um comentário em linha no PR pelo aplicativo do Mantis para GitHub
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- logs remotos: `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

O comentário do PR é atualizado no mesmo local por meio do marcador oculto `<!-- mantis-slack-desktop-smoke -->`.

## CLI local

Comprovação a frio a partir do código-fonte:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

Mantenha a VM para recuperação por VNC:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Abra o VNC:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Reutilize uma concessão aquecida:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Use `--hydrate-mode prehydrated` somente quando o espaço de trabalho remoto reutilizado já
tiver `node_modules` e um `dist/` compilado; caso contrário, o Mantis falha de forma segura.

Comprove a interface nativa de aprovação do Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` é mutuamente exclusivo com `--gateway-setup`. Ele executa
os cenários opcionais `slack-approval-exec-native` e `slack-approval-plugin-native`,
a menos que você forneça um `--scenario` explícito de ponto de verificação de aprovação; outros
cenários do Slack são rejeitados antes da inicialização da VM. O executor de QA do Slack grava
cada arquivo JSON de ponto de verificação a partir da mensagem real da API do Slack observada e, em seguida,
o observador remoto renderiza essa mensagem em
`approval-checkpoints/<scenario>-pending.png` e
`approval-checkpoints/<scenario>-resolved.png`. A execução falha se qualquer
JSON de ponto de verificação, evidência de mensagem, JSON de confirmação ou captura de tela renderizada estiver ausente
ou vazio.

As concessões a frio do GitHub Actions não têm cookies do Slack Web, portanto a captura do navegador
pode terminar na tela de login do Slack. Para a comprovação dos pontos de verificação de aprovação, confie nas
imagens renderizadas dos pontos de verificação e nos artefatos de QA do Slack, em vez de
`slack-desktop-smoke.png`. Use uma concessão aquecida mantida, com um perfil do Slack Web
autenticado manualmente, somente quando a própria captura de tela do navegador precisar mostrar o
Slack Web.

## Modos de hidratação

| Modo          | Use quando                                      | Comportamento remoto                                                                    | Compensação                                                        |
| ------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `source`      | Comprovação normal de PR, máquinas frias, CI    | Executa `pnpm install --frozen-lockfile --prefer-offline` e `pnpm build` dentro da VM   | Mais lento, comprovação mais robusta do checkout do código-fonte   |
| `prehydrated` | Você preparou intencionalmente uma concessão reutilizada | Exige `node_modules` e `dist/` existentes; ignora instalação/compilação                 | Rápido, mas válido apenas para concessões aquecidas controladas pelo operador |

O GitHub Actions sempre prepara o checkout candidato antes da execução da VM. O armazenamento do
pnpm é armazenado em cache por sistema operacional, versão do Node e arquivo de lock. A execução `source` da VM
também reutiliza `/var/cache/crabbox/pnpm` quando presente.

## Interpretação dos tempos

`mantis-slack-desktop-smoke-report.md` inclui os tempos das fases:

- `crabbox.warmup` - inicialização do provedor de nuvem, prontidão do desktop/navegador e SSH.
- `crabbox.inspect` - consulta dos metadados da concessão.
- `credentials.prepare` - aquisição da concessão de credenciais do Convex.
- `crabbox.remote_run` - sincronização, inicialização do navegador, instalação/compilação do OpenClaw ou
  validação da hidratação, inicialização do Gateway, captura de tela e gravação de vídeo.
- `artifacts.copy` - rsync de volta a partir da VM.

`crabbox.remote_run` pode exibir `accepted` quando o Crabbox retorna um status remoto
diferente de zero, mas o Mantis copiou metadados que comprovam que a configuração do Gateway do OpenClaw
foi concluída ou que o próprio comando de QA do Slack foi encerrado com êxito. Considere
`accepted` como aprovação com explicação, não como cenário com falha.

Se uma execução estiver lenta:

- O aquecimento predomina: pré-incorpore ou promova uma imagem melhor do provedor do Crabbox.
- `remote_run` predomina em `source`: use uma concessão aquecida, melhore a reutilização do armazenamento
  do pnpm ou mova os pré-requisitos da máquina para a imagem do provedor.
- `remote_run` predomina em `prehydrated`: o espaço de trabalho remoto não estava
  realmente pronto, ou a configuração do Gateway/navegador/Slack está lenta.
- A cópia de artefatos predomina: inspecione o tamanho do vídeo e o conteúdo do diretório de artefatos.

## Lista de verificação de evidências

Um bom comentário de PR mostra:

- ID do cenário e SHA candidato
- URL da execução do GitHub Actions e URL do artefato
- captura de tela em linha do ponto de verificação de aprovação ou uma captura de tela do Slack Web de uma
  concessão aquecida autenticada
- prévia animada em linha, quando disponível
- links para o MP4 completo e o MP4 recortado
- status de aprovação/falha e o resumo de tempos do relatório

Não faça commit de capturas de tela ou vídeos no repositório. Mantenha-os nos artefatos do GitHub
Actions ou no comentário do PR.

## Tratamento de falhas

Se o fluxo de trabalho falhar antes da execução da VM, inspecione primeiro o job do Actions.
Causas comuns: `candidate_ref` não confiável, segredos de ambiente ausentes ou falha na
instalação/compilação do candidato.

Se a execução da VM falhar, mas as capturas de tela tiverem sido copiadas de volta, inspecione:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Se a execução manteve a concessão, abra o VNC com o comando `crabbox vnc ...`
do relatório e interrompa a concessão quando terminar:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Se o login do Slack tiver expirado, corrija-o no VNC em uma concessão mantida e execute novamente com
`--lease-id`. Não incorpore esse perfil de navegador em uma imagem do provedor.

## Relacionados

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation)
- [Canal do Slack](/pt-BR/channels/slack)
- [Testes](/pt-BR/help/testing)
