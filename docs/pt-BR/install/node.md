---
read_when:
    - Você precisa instalar o Node.js antes de instalar o OpenClaw
    - Você instalou o OpenClaw, mas `openclaw` retorna comando não encontrado
    - npm install -g falha com problemas de permissões ou de PATH
summary: Instale e configure o Node.js para o OpenClaw - requisitos de versão, opções de instalação e solução de problemas de PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-04T08:44:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c556593982efa7f6fcd6e24787cca7ca6af30d265f54bb927a0608d2efc58d6
    source_path: install/node.md
    workflow: 16
---

OpenClaw requer **Node 22.19+, Node 23.11+ ou Node 24+**. **Node 24 é o runtime padrão e recomendado** para instalações, CI e fluxos de release. Node 22 continua compatível pela linha LTS ativa. O [script de instalação](/pt-BR/install#alternative-install-methods) detectará e instalará o Node automaticamente - esta página é para quando você quiser configurar o Node por conta própria e garantir que tudo esteja conectado corretamente (versões, PATH, instalações globais).

## Verifique sua versão

```bash
node -v
```

Se isso imprimir `v24.x.x` ou superior, você está no padrão recomendado. Se imprimir `v22.19.x` ou superior, você está no caminho compatível do Node 22 LTS, mas ainda recomendamos atualizar para o Node 24 quando for conveniente. Versões do Node 23 anteriores a `v23.11.0` não são compatíveis. Se o Node não estiver instalado ou a versão estiver fora do intervalo compatível, escolha um método de instalação abaixo.

## Instale o Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (recomendado):

    ```bash
    brew install node
    ```

    Ou baixe o instalador para macOS em [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    Ou use um gerenciador de versões (veja abaixo).

  </Tab>
  <Tab title="Windows">
    **winget** (recomendado):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Ou baixe o instalador para Windows em [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  Gerenciadores de versão permitem alternar facilmente entre versões do Node. Opções populares:

- [**fnm**](https://github.com/Schniz/fnm) - rápido e multiplataforma
- [**nvm**](https://github.com/nvm-sh/nvm) - amplamente usado no macOS/Linux
- [**mise**](https://mise.jdx.dev/) - poliglota (Node, Python, Ruby etc.)

Exemplo com fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Certifique-se de que seu gerenciador de versões esteja inicializado no arquivo de inicialização do seu shell (`~/.zshrc` ou `~/.bashrc`). Se não estiver, `openclaw` pode não ser encontrado em novas sessões de terminal porque o PATH não incluirá o diretório bin do Node.
  </Warning>
</Accordion>

## Solução de problemas

### `openclaw: command not found`

Isso quase sempre significa que o diretório bin global do npm não está no seu PATH.

<Steps>
  <Step title="Find your global npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Check if it's on your PATH">
    ```bash
    echo "$PATH"
    ```

    Procure por `<npm-prefix>/bin` (macOS/Linux) ou `<npm-prefix>` (Windows) na saída.

  </Step>
  <Step title="Add it to your shell startup file">
    <Tabs>
      <Tab title="macOS / Linux">
        Adicione a `~/.zshrc` ou `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Depois abra um novo terminal (ou execute `rehash` no zsh / `hash -r` no bash).
      </Tab>
      <Tab title="Windows">
        Adicione a saída de `npm prefix -g` ao PATH do sistema em Configurações → Sistema → Variáveis de Ambiente.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Erros de permissão em `npm install -g` (Linux)

Se você vir erros `EACCES`, altere o prefixo global do npm para um diretório gravável pelo usuário:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Adicione a linha `export PATH=...` ao seu `~/.bashrc` ou `~/.zshrc` para torná-la permanente.

## Relacionados

- [Visão geral da instalação](/pt-BR/install) - todos os métodos de instalação
- [Atualização](/pt-BR/install/updating) - manter o OpenClaw atualizado
- [Primeiros passos](/pt-BR/start/getting-started) - primeiros passos após a instalação
