---
read_when:
    - Você quer remover o OpenClaw de uma máquina
    - O serviço do Gateway continua em execução após a desinstalação
summary: Desinstalar o OpenClaw completamente (CLI, serviço, estado, espaço de trabalho)
title: Desinstalar
x-i18n:
    generated_at: "2026-07-12T15:22:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

Dois caminhos:

- **Caminho fácil** se o `openclaw` ainda estiver instalado.
- **Remoção manual do serviço** se a CLI não estiver mais disponível, mas o serviço ainda estiver em execução.

## Caminho fácil (CLI ainda instalada)

Recomendado: use o desinstalador integrado:

```bash
openclaw uninstall
```

A remoção do estado preserva os diretórios de espaço de trabalho configurados, a menos que você também selecione `--workspace`.

Visualize o que será removido (seguro):

```bash
openclaw uninstall --dry-run --all
```

Não interativo (automação / npx). Use com cautela e somente após confirmar os escopos:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Flags: `--service`, `--state`, `--workspace` e `--app` selecionam escopos individuais; `--all` seleciona os quatro.

Etapas manuais (mesmo resultado):

1. Pare o serviço do Gateway:

```bash
openclaw gateway stop
```

2. Desinstale o serviço do Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Exclua o estado e a configuração:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Se você definiu `OPENCLAW_CONFIG_PATH` como um local personalizado fora do diretório de estado, exclua também esse arquivo.
Se quiser manter um espaço de trabalho dentro do diretório de estado, como `~/.openclaw/workspace`, mova-o para outro local antes de executar `rm -rf` ou exclua seletivamente o conteúdo do estado.

4. Exclua seu espaço de trabalho (opcional, remove os arquivos do agente):

```bash
rm -rf ~/.openclaw/workspace
```

5. Remova a instalação da CLI (escolha o método que você usou):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Se você instalou o aplicativo para macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Observações:

- Se você usou perfis (`--profile` / `OPENCLAW_PROFILE`), repita a etapa 3 para cada diretório de estado (os padrões são `~/.openclaw-<profile>`).
- No modo remoto, o diretório de estado fica no **host do Gateway**, portanto execute também as etapas 1 a 4 nesse host.

## Remoção manual do serviço (CLI não instalada)

Use esta opção se o serviço do Gateway continuar em execução, mas o `openclaw` não estiver disponível.

### macOS (launchd)

O rótulo padrão é `ai.openclaw.gateway` (ou `ai.openclaw.<profile>` com um perfil):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Se você usou um perfil, substitua o rótulo e o nome do arquivo plist por `ai.openclaw.<profile>`.

### Linux (unidade de usuário do systemd)

O nome padrão da unidade é `openclaw-gateway.service` (ou `openclaw-gateway-<profile>.service`). Uma unidade anterior à renomeação, `clawdbot-gateway.service`, ainda pode existir em máquinas atualizadas a partir de instalações muito antigas; `openclaw uninstall` / `openclaw gateway uninstall` a detecta e remove automaticamente.

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Tarefa Agendada)

O nome padrão da tarefa é `OpenClaw Gateway` (ou `OpenClaw Gateway (<profile>)`).
A tarefa inicia um script `gateway.vbs` sem janela no seu diretório de estado, que, por sua vez,
executa `gateway.cmd`; remova ambos.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Se você usou um perfil, exclua o nome de tarefa correspondente e os arquivos `gateway.cmd` /
`gateway.vbs` em `~\.openclaw-<profile>`.

## Instalação normal versus checkout do código-fonte

### Instalação normal (install.sh / npm / pnpm / bun)

Se você usou `https://openclaw.ai/install.sh` ou `install.ps1`, a CLI foi instalada com `npm install -g openclaw@latest`.
Remova-a com `npm rm -g openclaw` (ou `pnpm remove -g` / `bun remove -g` se você a instalou dessa forma).

### Checkout do código-fonte (git clone)

Se você executa a partir de um checkout do repositório (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Desinstale o serviço do Gateway **antes** de excluir o repositório (use o caminho fácil acima ou a remoção manual do serviço).
2. Exclua o diretório do repositório.
3. Remova o estado e o espaço de trabalho conforme mostrado acima.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Guia de migração](/pt-BR/install/migrating)
