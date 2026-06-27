---
read_when:
    - Você quer remover o OpenClaw de uma máquina
    - O serviço de gateway ainda está em execução após a desinstalação
summary: Desinstale o OpenClaw completamente (CLI, serviço, estado, espaço de trabalho)
title: Desinstalar
x-i18n:
    generated_at: "2026-06-27T17:39:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

Dois caminhos:

- **Caminho fácil** se `openclaw` ainda estiver instalado.
- **Remoção manual do serviço** se a CLI tiver sido removida, mas o serviço ainda estiver em execução.

## Caminho fácil (CLI ainda instalada)

Recomendado: use o desinstalador integrado:

```bash
openclaw uninstall
```

Ao usar a CLI, a remoção do estado preserva os diretórios de workspace configurados, a menos que você também selecione `--workspace`.

Pré-visualize o que será removido (seguro):

```bash
openclaw uninstall --dry-run --all
```

Não interativo (automação / npx). Use com cautela e somente após confirmar os escopos:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Etapas manuais (mesmo resultado):

1. Pare o serviço Gateway:

```bash
openclaw gateway stop
```

2. Desinstale o serviço Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Exclua estado + configuração:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Se você definiu `OPENCLAW_CONFIG_PATH` para um local personalizado fora do diretório de estado, exclua esse arquivo também.
Se quiser manter um workspace dentro do diretório de estado, como `~/.openclaw/workspace`, mova-o para outro lugar antes de executar `rm -rf` ou exclua o conteúdo do estado seletivamente.

4. Exclua seu workspace (opcional, remove arquivos de agentes):

```bash
rm -rf ~/.openclaw/workspace
```

5. Remova a instalação da CLI (escolha a que você usou):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Se você instalou o app para macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Observações:

- Se você usou perfis (`--profile` / `OPENCLAW_PROFILE`), repita a etapa 3 para cada diretório de estado (os padrões são `~/.openclaw-<profile>`).
- No modo remoto, o diretório de estado fica no **host Gateway**, então execute as etapas 1 a 4 lá também.

## Remoção manual do serviço (CLI não instalada)

Use isto se o serviço Gateway continuar em execução, mas `openclaw` estiver ausente.

### macOS (launchd)

O rótulo padrão é `ai.openclaw.gateway` (ou `ai.openclaw.<profile>`; o legado `com.openclaw.*` ainda pode existir):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Se você usou um perfil, substitua o rótulo e o nome do plist por `ai.openclaw.<profile>`. Remova quaisquer plists legados `com.openclaw.*` se estiverem presentes.

### Linux (unidade de usuário systemd)

O nome padrão da unidade é `openclaw-gateway.service` (ou `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Tarefa Agendada)

O nome padrão da tarefa é `OpenClaw Gateway` (ou `OpenClaw Gateway (<profile>)`).
O script da tarefa fica no seu diretório de estado como `gateway.cmd`; instalações atuais também podem
criar um inicializador sem janela `gateway.vbs` que o Agendador de Tarefas executa em vez
de abrir `gateway.cmd` diretamente.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Se você usou um perfil, exclua o nome da tarefa correspondente e os arquivos `gateway.cmd` /
`gateway.vbs` em `~\.openclaw-<profile>`.

## Instalação normal vs checkout de código-fonte

### Instalação normal (install.sh / npm / pnpm / bun)

Se você usou `https://openclaw.ai/install.sh` ou `install.ps1`, a CLI foi instalada com `npm install -g openclaw@latest`.
Remova-a com `npm rm -g openclaw` (ou `pnpm remove -g` / `bun remove -g` se você instalou dessa forma).

### Checkout de código-fonte (git clone)

Se você executa a partir de um checkout do repositório (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Desinstale o serviço Gateway **antes** de excluir o repositório (use o caminho fácil acima ou a remoção manual do serviço).
2. Exclua o diretório do repositório.
3. Remova estado + workspace conforme mostrado acima.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Guia de migração](/pt-BR/install/migrating)
