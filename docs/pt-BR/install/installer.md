---
read_when:
    - Você quer entender `openclaw.ai/install.sh`
    - Você quer automatizar instalações (CI / sem interface gráfica)
    - Você deseja instalar a partir de um checkout do GitHub
summary: Como funcionam os scripts de instalação (install.sh, install-cli.sh, install.ps1), as opções e a automação
title: Detalhes internos do instalador
x-i18n:
    generated_at: "2026-05-02T05:50:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 119d94edae8cae2460e1bce9fe6bb31dc3c91d23443090cd34bf10adde9e10f1
    source_path: install/installer.md
    workflow: 16
---

OpenClaw inclui três scripts de instalação, servidos a partir de `openclaw.ai`.

| Script                             | Plataforma           | O que faz                                                                                                                |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instala Node se necessário, instala OpenClaw via npm (padrão) ou git, e pode executar a integração inicial.              |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instala Node + OpenClaw em um prefixo local (`~/.openclaw`) com modos npm ou checkout git. Não requer root.              |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instala Node se necessário, instala OpenClaw via npm (padrão) ou git, e pode executar a integração inicial.              |

## Comandos rápidos

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Se a instalação for concluída, mas `openclaw` não for encontrado em um novo terminal, consulte [solução de problemas do Node.js](/pt-BR/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Recomendado para a maioria das instalações interativas no macOS/Linux/WSL.
</Tip>

### Fluxo (install.sh)

<Steps>
  <Step title="Detect OS">
    Compatível com macOS e Linux (incluindo WSL). Se macOS for detectado, instala Homebrew se estiver ausente.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Verifica a versão do Node e instala Node 24 se necessário (Homebrew no macOS, scripts de configuração do NodeSource no Linux apt/dnf/yum). OpenClaw ainda oferece suporte ao Node 22 LTS, atualmente `22.14+`, para compatibilidade.
  </Step>
  <Step title="Ensure Git">
    Instala Git se estiver ausente.
  </Step>
  <Step title="Install OpenClaw">
    - método `npm` (padrão): instalação global via npm
    - método `git`: clona/atualiza o repositório, instala dependências com pnpm, compila e então instala o wrapper em `~/.local/bin/openclaw`

  </Step>
  <Step title="Post-install tasks">
    - Atualiza um serviço de gateway carregado em modo melhor esforço (`openclaw gateway install --force`, depois reinicia)
    - Executa `openclaw doctor --non-interactive` em atualizações e instalações via git (melhor esforço)
    - Tenta a integração inicial quando apropriado (TTY disponível, integração inicial não desativada e verificações de bootstrap/configuração aprovadas)
    - Define `SHARP_IGNORE_GLOBAL_LIBVIPS=1` por padrão

  </Step>
</Steps>

### Detecção de checkout de código-fonte

Se executado dentro de um checkout do OpenClaw (`package.json` + `pnpm-workspace.yaml`), o script oferece:

- usar checkout (`git`), ou
- usar instalação global (`npm`)

Se nenhum TTY estiver disponível e nenhum método de instalação for definido, ele usa `npm` por padrão e avisa.

O script sai com código `2` para seleção de método inválida ou valores inválidos de `--install-method`.

### Exemplos (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flag                                  | Descrição                                                         |
| ------------------------------------- | ----------------------------------------------------------------- |
| `--install-method npm\|git`           | Escolha o método de instalação (padrão: `npm`). Alias: `--method` |
| `--npm`                               | Atalho para o método npm                                          |
| `--git`                               | Atalho para o método git. Alias: `--github`                       |
| `--version <version\|dist-tag\|spec>` | versão npm, dist-tag ou especificação de pacote (padrão: `latest`) |
| `--beta`                              | Usa a dist-tag beta se disponível; caso contrário, fallback para `latest` |
| `--git-dir <path>`                    | Diretório de checkout (padrão: `~/openclaw`). Alias: `--dir`      |
| `--no-git-update`                     | Pula `git pull` para checkout existente                           |
| `--no-prompt`                         | Desativa prompts                                                  |
| `--no-onboard`                        | Pula a integração inicial                                         |
| `--onboard`                           | Ativa a integração inicial                                        |
| `--dry-run`                           | Imprime ações sem aplicar alterações                              |
| `--verbose`                           | Ativa saída de depuração (`set -x`, logs npm em nível notice)     |
| `--help`                              | Mostra o uso (`-h`)                                               |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variável                                                | Descrição                                      |
| ------------------------------------------------------- | ---------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Método de instalação                           |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | versão npm, dist-tag ou especificação de pacote |
| `OPENCLAW_BETA=0\|1`                                    | Usa beta se disponível                         |
| `OPENCLAW_GIT_DIR=<path>`                               | Diretório de checkout                          |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Alterna atualizações git                       |
| `OPENCLAW_NO_PROMPT=1`                                  | Desativa prompts                               |
| `OPENCLAW_NO_ONBOARD=1`                                 | Pula a integração inicial                      |
| `OPENCLAW_DRY_RUN=1`                                    | Modo de execução simulada                      |
| `OPENCLAW_VERBOSE=1`                                    | Modo de depuração                              |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Nível de log do npm                            |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Controla o comportamento sharp/libvips (padrão: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Projetado para ambientes em que você quer tudo sob um prefixo local
(padrão `~/.openclaw`) e sem dependência do Node do sistema. Oferece suporte a instalações npm
por padrão, além de instalações por checkout git no mesmo fluxo de prefixo.
</Info>

### Fluxo (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    Baixa um tarball Node LTS compatível e fixado (a versão é incorporada ao script e atualizada independentemente) para `<prefix>/tools/node-v<version>` e verifica SHA-256.
  </Step>
  <Step title="Ensure Git">
    Se Git estiver ausente, tenta instalar via apt/dnf/yum no Linux ou Homebrew no macOS.
  </Step>
  <Step title="Install OpenClaw under prefix">
    - método `npm` (padrão): instala sob o prefixo com npm e então grava o wrapper em `<prefix>/bin/openclaw`
    - método `git`: clona/atualiza um checkout (padrão `~/openclaw`) e ainda grava o wrapper em `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    Se um serviço de gateway já estiver carregado a partir desse mesmo prefixo, o script executa
    `openclaw gateway install --force`, depois `openclaw gateway restart`, e
    verifica a saúde do gateway em melhor esforço.
  </Step>
</Steps>

### Exemplos (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flag                        | Descrição                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------ |
| `--prefix <path>`           | Prefixo de instalação (padrão: `~/.openclaw`)                                        |
| `--install-method npm\|git` | Escolha o método de instalação (padrão: `npm`). Alias: `--method`                    |
| `--npm`                     | Atalho para o método npm                                                             |
| `--git`, `--github`         | Atalho para o método git                                                             |
| `--git-dir <path>`          | Diretório de checkout git (padrão: `~/openclaw`). Alias: `--dir`                     |
| `--version <ver>`           | Versão do OpenClaw ou dist-tag (padrão: `latest`)                                    |
| `--node-version <ver>`      | Versão do Node (padrão: `22.22.0`)                                                   |
| `--json`                    | Emite eventos NDJSON                                                                 |
| `--onboard`                 | Executa `openclaw onboard` após a instalação                                         |
| `--no-onboard`              | Pula a integração inicial (padrão)                                                   |
| `--set-npm-prefix`          | No Linux, força o prefixo npm para `~/.npm-global` se o prefixo atual não for gravável |
| `--help`                    | Mostra o uso (`-h`)                                                                  |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variável                                    | Descrição                                     |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefixo de instalação                         |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Método de instalação                          |
| `OPENCLAW_VERSION=<ver>`                    | Versão ou dist-tag do OpenClaw                |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versão do Node                                |
| `OPENCLAW_GIT_DIR=<path>`                   | Diretório de checkout Git para instalações via git |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Ativa/desativa atualizações git para checkouts existentes |
| `OPENCLAW_NO_ONBOARD=1`                     | Pula a integração inicial                     |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Nível de log do npm                           |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Controla o comportamento do sharp/libvips (padrão: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Fluxo (install.ps1)

<Steps>
  <Step title="Ensure PowerShell + Windows environment">
    Exige PowerShell 5+.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Se ausente, tenta instalar via winget, depois Chocolatey e depois Scoop. Node 22 LTS, atualmente `22.14+`, continua com suporte por compatibilidade.
  </Step>
  <Step title="Install OpenClaw">
    - Método `npm` (padrão): instalação npm global usando a `-Tag` selecionada, iniciada a partir de um diretório temporário gravável do instalador para que shells abertos em pastas protegidas, como `C:\`, ainda funcionem
    - Método `git`: clona/atualiza o repositório, instala/compila com pnpm e instala o wrapper em `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Post-install tasks">
    - Adiciona o diretório bin necessário ao PATH do usuário quando possível
    - Atualiza um serviço Gateway carregado em modo de melhor esforço (`openclaw gateway install --force`, depois reinicia)
    - Executa `openclaw doctor --non-interactive` em atualizações e instalações via git (melhor esforço)

  </Step>
  <Step title="Handle failures">
    Instalações com `iwr ... | iex` e scriptblock relatam um erro terminante sem fechar a sessão atual do PowerShell. Instalações diretas com `powershell -File` / `pwsh -File` ainda saem com código diferente de zero para automação.
  </Step>
</Steps>

### Exemplos (install.ps1)

<Tabs>
  <Tab title="Default">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git install">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Custom git directory">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug trace">
    ```powershell
    # install.ps1 ainda não tem uma flag -Verbose dedicada.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flag                        | Descrição                                                  |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Método de instalação (padrão: `npm`)                       |
| `-Tag <tag\|version\|spec>` | dist-tag, versão ou especificação de pacote npm (padrão: `latest`) |
| `-GitDir <path>`            | Diretório de checkout (padrão: `%USERPROFILE%\openclaw`)   |
| `-NoOnboard`                | Pula a integração inicial                                  |
| `-NoGitUpdate`              | Pula `git pull`                                            |
| `-DryRun`                   | Imprime apenas as ações                                    |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variável                           | Descrição                 |
| ---------------------------------- | ------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Método de instalação      |
| `OPENCLAW_GIT_DIR=<path>`          | Diretório de checkout     |
| `OPENCLAW_NO_ONBOARD=1`            | Pula a integração inicial |
| `OPENCLAW_GIT_UPDATE=0`            | Desabilita git pull       |
| `OPENCLAW_DRY_RUN=1`               | Modo de simulação         |

  </Accordion>
</AccordionGroup>

<Note>
Se `-InstallMethod git` for usado e o Git estiver ausente, o script sai e imprime o link do Git for Windows.
</Note>

---

## CI e automação

Use flags/variáveis de ambiente não interativas para execuções previsíveis.

<Tabs>
  <Tab title="install.sh (non-interactive npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (non-interactive git)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (skip onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Solução de problemas

<AccordionGroup>
  <Accordion title="Why is Git required?">
    Git é necessário para o método de instalação `git`. Para instalações via `npm`, o Git ainda é verificado/instalado para evitar falhas `spawn git ENOENT` quando dependências usam URLs git.
  </Accordion>

  <Accordion title="Why does npm hit EACCES on Linux?">
    Algumas configurações do Linux apontam o prefixo global do npm para caminhos pertencentes ao root. `install.sh` pode trocar o prefixo para `~/.npm-global` e acrescentar exportações de PATH aos arquivos rc do shell (quando esses arquivos existem).
  </Accordion>

  <Accordion title="sharp/libvips issues">
    Os scripts usam `SHARP_IGNORE_GLOBAL_LIBVIPS=1` por padrão para evitar que o sharp compile contra o libvips do sistema. Para substituir:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Instale o Git for Windows, reabra o PowerShell e execute o instalador novamente.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Execute `npm config get prefix` e adicione esse diretório ao PATH do seu usuário (sem necessidade do sufixo `\bin` no Windows), depois reabra o PowerShell.
  </Accordion>

  <Accordion title="Windows: how to get verbose installer output">
    `install.ps1` atualmente não expõe um switch `-Verbose`.
    Use o rastreamento do PowerShell para diagnósticos no nível do script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw not found after install">
    Geralmente é um problema de PATH. Consulte [solução de problemas do Node.js](/pt-BR/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Atualização](/pt-BR/install/updating)
- [Desinstalação](/pt-BR/install/uninstall)
