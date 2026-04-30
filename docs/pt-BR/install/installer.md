---
read_when:
    - Você quer entender `openclaw.ai/install.sh`
    - Você quer automatizar instalações (CI / sem interface gráfica)
    - Você quer instalar a partir de um checkout do GitHub
summary: Como funcionam os scripts de instalação (install.sh, install-cli.sh, install.ps1), sinalizadores e automação
title: Detalhes internos do instalador
x-i18n:
    generated_at: "2026-04-30T09:55:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 278e8d6a1a39651812b7f0955965c53c62afd3ad673b357484f8aecbcfbbdb1d
    source_path: install/installer.md
    workflow: 16
---

O OpenClaw distribui três scripts de instalação, servidos por `openclaw.ai`.

| Script                             | Plataforma           | O que faz                                                                                                      |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instala o Node se necessário, instala o OpenClaw via npm (padrão) ou git, e pode executar a integração inicial. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instala Node + OpenClaw em um prefixo local (`~/.openclaw`) com modos npm ou checkout git. Não requer root.    |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instala o Node se necessário, instala o OpenClaw via npm (padrão) ou git, e pode executar a integração inicial. |

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
Se a instalação for bem-sucedida, mas `openclaw` não for encontrado em um novo terminal, consulte [solução de problemas do Node.js](/pt-BR/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Recomendado para a maioria das instalações interativas no macOS/Linux/WSL.
</Tip>

### Fluxo (install.sh)

<Steps>
  <Step title="Detectar SO">
    Compatível com macOS e Linux (incluindo WSL). Se macOS for detectado, instala o Homebrew se estiver ausente.
  </Step>
  <Step title="Garantir Node.js 24 por padrão">
    Verifica a versão do Node e instala o Node 24 se necessário (Homebrew no macOS, scripts de configuração NodeSource no Linux apt/dnf/yum). O OpenClaw ainda oferece suporte ao Node 22 LTS, atualmente `22.14+`, para compatibilidade.
  </Step>
  <Step title="Garantir Git">
    Instala o Git se estiver ausente.
  </Step>
  <Step title="Instalar OpenClaw">
    - método `npm` (padrão): instalação npm global
    - método `git`: clona/atualiza o repositório, instala dependências com pnpm, compila e então instala o wrapper em `~/.local/bin/openclaw`

  </Step>
  <Step title="Tarefas pós-instalação">
    - Atualiza um serviço Gateway carregado em melhor esforço (`openclaw gateway install --force`, depois reinicia)
    - Executa `openclaw doctor --non-interactive` em upgrades e instalações git (melhor esforço)
    - Tenta a integração inicial quando apropriado (TTY disponível, integração inicial não desativada, e verificações de bootstrap/configuração passam)
    - Define `SHARP_IGNORE_GLOBAL_LIBVIPS=1` por padrão

  </Step>
</Steps>

### Detecção de checkout de origem

Se executado dentro de um checkout do OpenClaw (`package.json` + `pnpm-workspace.yaml`), o script oferece:

- usar checkout (`git`), ou
- usar instalação global (`npm`)

Se nenhum TTY estiver disponível e nenhum método de instalação estiver definido, ele usa `npm` por padrão e emite um aviso.

O script sai com código `2` para seleção de método inválida ou valores inválidos de `--install-method`.

### Exemplos (install.sh)

<Tabs>
  <Tab title="Padrão">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Pular integração inicial">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Instalação git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Simulação">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                                  | Descrição                                                  |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Escolhe o método de instalação (padrão: `npm`). Alias: `--method` |
| `--npm`                               | Atalho para o método npm                                   |
| `--git`                               | Atalho para o método git. Alias: `--github`                |
| `--version <version\|dist-tag\|spec>` | versão npm, dist-tag ou especificação de pacote (padrão: `latest`) |
| `--beta`                              | Usa a dist-tag beta se disponível; caso contrário, recorre a `latest` |
| `--git-dir <path>`                    | Diretório de checkout (padrão: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Pula `git pull` para checkout existente                    |
| `--no-prompt`                         | Desativa prompts                                           |
| `--no-onboard`                        | Pula a integração inicial                                  |
| `--onboard`                           | Ativa a integração inicial                                 |
| `--dry-run`                           | Imprime ações sem aplicar alterações                       |
| `--verbose`                           | Ativa saída de depuração (`set -x`, logs npm em nível notice) |
| `--help`                              | Mostra uso (`-h`)                                          |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                                                | Descrição                                     |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Método de instalação                          |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | versão npm, dist-tag ou especificação de pacote |
| `OPENCLAW_BETA=0\|1`                                    | Usa beta se disponível                        |
| `OPENCLAW_GIT_DIR=<path>`                               | Diretório de checkout                         |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Alterna atualizações git                      |
| `OPENCLAW_NO_PROMPT=1`                                  | Desativa prompts                              |
| `OPENCLAW_NO_ONBOARD=1`                                 | Pula a integração inicial                     |
| `OPENCLAW_DRY_RUN=1`                                    | Modo de simulação                             |
| `OPENCLAW_VERBOSE=1`                                    | Modo de depuração                             |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Nível de log npm                              |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Controla o comportamento sharp/libvips (padrão: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Projetado para ambientes em que você quer tudo sob um prefixo local
(padrão `~/.openclaw`) e nenhuma dependência de Node do sistema. Oferece suporte a instalações npm
por padrão, além de instalações por checkout git no mesmo fluxo de prefixo.
</Info>

### Fluxo (install-cli.sh)

<Steps>
  <Step title="Instalar runtime Node local">
    Baixa um tarball Node LTS compatível fixado (a versão é incorporada no script e atualizada independentemente) para `<prefix>/tools/node-v<version>` e verifica SHA-256.
  </Step>
  <Step title="Garantir Git">
    Se o Git estiver ausente, tenta instalar via apt/dnf/yum no Linux ou Homebrew no macOS.
  </Step>
  <Step title="Instalar OpenClaw sob o prefixo">
    - método `npm` (padrão): instala sob o prefixo com npm e então grava o wrapper em `<prefix>/bin/openclaw`
    - método `git`: clona/atualiza um checkout (padrão `~/openclaw`) e ainda grava o wrapper em `<prefix>/bin/openclaw`

  </Step>
  <Step title="Atualizar serviço Gateway carregado">
    Se um serviço Gateway já estiver carregado a partir desse mesmo prefixo, o script executa
    `openclaw gateway install --force`, depois `openclaw gateway restart`, e
    verifica a saúde do Gateway em melhor esforço.
  </Step>
</Steps>

### Exemplos (install-cli.sh)

<Tabs>
  <Tab title="Padrão">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Prefixo personalizado + versão">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Instalação git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Saída JSON de automação">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Executar integração inicial">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                        | Descrição                                                                       |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefixo de instalação (padrão: `~/.openclaw`)                                   |
| `--install-method npm\|git` | Escolhe o método de instalação (padrão: `npm`). Alias: `--method`               |
| `--npm`                     | Atalho para o método npm                                                        |
| `--git`, `--github`         | Atalho para o método git                                                        |
| `--git-dir <path>`          | Diretório de checkout git (padrão: `~/openclaw`). Alias: `--dir`                |
| `--version <ver>`           | Versão ou dist-tag do OpenClaw (padrão: `latest`)                               |
| `--node-version <ver>`      | Versão do Node (padrão: `22.22.0`)                                              |
| `--json`                    | Emite eventos NDJSON                                                            |
| `--onboard`                 | Executa `openclaw onboard` após a instalação                                    |
| `--no-onboard`              | Pula a integração inicial (padrão)                                              |
| `--set-npm-prefix`          | No Linux, força o prefixo npm para `~/.npm-global` se o prefixo atual não for gravável |
| `--help`                    | Mostra uso (`-h`)                                                               |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                                   | Descrição                                      |
| ------------------------------------------ | ---------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                   | Prefixo de instalação                          |
| `OPENCLAW_INSTALL_METHOD=git\|npm`         | Método de instalação                           |
| `OPENCLAW_VERSION=<ver>`                   | Versão ou dist-tag do OpenClaw                 |
| `OPENCLAW_NODE_VERSION=<ver>`              | Versão do Node                                 |
| `OPENCLAW_GIT_DIR=<path>`                  | Diretório de checkout do Git para instalações via git |
| `OPENCLAW_GIT_UPDATE=0\|1`                 | Ativa/desativa atualizações do git para checkouts existentes |
| `OPENCLAW_NO_ONBOARD=1`                    | Ignorar onboarding                             |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Nível de log do npm                            |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`         | Controla o comportamento do sharp/libvips (padrão: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Fluxo (install.ps1)

<Steps>
  <Step title="Garantir ambiente PowerShell + Windows">
    Requer PowerShell 5+.
  </Step>
  <Step title="Garantir Node.js 24 por padrão">
    Se estiver ausente, tenta instalar via winget, depois Chocolatey, depois Scoop. Node 22 LTS, atualmente `22.14+`, continua compatível.
  </Step>
  <Step title="Instalar OpenClaw">
    - método `npm` (padrão): instalação global do npm usando a `-Tag` selecionada
    - método `git`: clona/atualiza o repositório, instala/compila com pnpm e instala o wrapper em `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Tarefas pós-instalação">
    - Adiciona o diretório bin necessário ao PATH do usuário quando possível
    - Atualiza um serviço de Gateway carregado em modo melhor esforço (`openclaw gateway install --force`, depois reinicia)
    - Executa `openclaw doctor --non-interactive` em upgrades e instalações via git (melhor esforço)

  </Step>
  <Step title="Lidar com falhas">
    Instalações com `iwr ... | iex` e scriptblock relatam um erro terminante sem fechar a sessão atual do PowerShell. Instalações diretas com `powershell -File` / `pwsh -File` ainda saem com código diferente de zero para automação.
  </Step>
</Steps>

### Exemplos (install.ps1)

<Tabs>
  <Tab title="Padrão">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalação via Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="main do GitHub via npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Diretório git personalizado">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Execução de teste">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Rastreamento de depuração">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                        | Descrição                                                  |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Método de instalação (padrão: `npm`)                      |
| `-Tag <tag\|version\|spec>` | dist-tag, versão ou especificação de pacote do npm (padrão: `latest`) |
| `-GitDir <path>`            | Diretório de checkout (padrão: `%USERPROFILE%\openclaw`)  |
| `-NoOnboard`                | Ignorar onboarding                                         |
| `-NoGitUpdate`              | Ignorar `git pull`                                         |
| `-DryRun`                   | Apenas imprime ações                                       |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                           | Descrição               |
| ---------------------------------- | ----------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Método de instalação    |
| `OPENCLAW_GIT_DIR=<path>`          | Diretório de checkout   |
| `OPENCLAW_NO_ONBOARD=1`            | Ignorar onboarding      |
| `OPENCLAW_GIT_UPDATE=0`            | Desabilitar git pull    |
| `OPENCLAW_DRY_RUN=1`               | Modo de execução de teste |

  </Accordion>
</AccordionGroup>

<Note>
Se `-InstallMethod git` for usado e o Git estiver ausente, o script sai e imprime o link do Git for Windows.
</Note>

---

## CI e automação

Use flags/variáveis de ambiente não interativas para execuções previsíveis.

<Tabs>
  <Tab title="install.sh (npm não interativo)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git não interativo)">
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
  <Tab title="install.ps1 (ignorar onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Solução de problemas

<AccordionGroup>
  <Accordion title="Por que o Git é necessário?">
    Git é necessário para o método de instalação `git`. Para instalações via `npm`, o Git ainda é verificado/instalado para evitar falhas `spawn git ENOENT` quando dependências usam URLs git.
  </Accordion>

  <Accordion title="Por que o npm encontra EACCES no Linux?">
    Algumas configurações do Linux apontam o prefixo global do npm para caminhos pertencentes ao root. `install.sh` pode mudar o prefixo para `~/.npm-global` e anexar exportações PATH aos arquivos rc do shell (quando esses arquivos existem).
  </Accordion>

  <Accordion title="Problemas com sharp/libvips">
    Os scripts usam `SHARP_IGNORE_GLOBAL_LIBVIPS=1` por padrão para evitar que o sharp seja compilado contra o libvips do sistema. Para substituir:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "erro npm spawn git / ENOENT"'>
    Instale o Git for Windows, reabra o PowerShell e execute o instalador novamente.
  </Accordion>

  <Accordion title='Windows: "openclaw não é reconhecido"'>
    Execute `npm config get prefix` e adicione esse diretório ao PATH do usuário (sem necessidade do sufixo `\bin` no Windows), depois reabra o PowerShell.
  </Accordion>

  <Accordion title="Windows: como obter saída detalhada do instalador">
    `install.ps1` atualmente não expõe uma opção `-Verbose`.
    Use o rastreamento do PowerShell para diagnósticos no nível do script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw não encontrado após a instalação">
    Geralmente é um problema de PATH. Consulte [solução de problemas do Node.js](/pt-BR/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Atualização](/pt-BR/install/updating)
- [Desinstalação](/pt-BR/install/uninstall)
