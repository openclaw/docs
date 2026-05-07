---
read_when:
    - É necessário instalar o Node.js antes de instalar o OpenClaw
    - Você instalou o OpenClaw, mas `openclaw` retorna comando não encontrado
    - npm install -g falha com problemas de permissões ou de PATH
summary: Instale e configure o Node.js para o OpenClaw - requisitos de versão, opções de instalação e solução de problemas do PATH
title: Node.js
x-i18n:
    generated_at: "2026-05-07T13:20:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8ef8d00c8996741187000f55d07d15a2d09e89b6deb99cf687b6b9128ad266
    source_path: install/node.md
    workflow: 16
---

OpenClaw requer **Node 22.16 ou mais recente**. **Node 24 é o runtime padrão e recomendado** para instalações, CI e fluxos de lançamento. Node 22 continua com suporte pela linha LTS ativa. O [script de instalação](/pt-BR/install#alternative-install-methods) detectará e instalará o Node automaticamente - esta página é para quando você quiser configurar o Node por conta própria e garantir que tudo esteja conectado corretamente (versões, PATH, instalações globais).

## Verifique sua versão

```bash
node -v
```

Se isso imprimir `v24.x.x` ou superior, você está no padrão recomendado. Se imprimir `v22.16.x` ou superior, você está no caminho compatível do Node 22 LTS, mas ainda recomendamos atualizar para o Node 24 quando for conveniente. Se o Node não estiver instalado ou a versão for antiga demais, escolha um método de instalação abaixo.

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
  Gerenciadores de versões permitem alternar entre versões do Node facilmente. Opções populares:

- [**fnm**](https://github.com/Schniz/fnm) - rápido, multiplataforma
- [**nvm**](https://github.com/nvm-sh/nvm) - amplamente usado no macOS/Linux
- [**mise**](https://mise.jdx.dev/) - poliglota (Node, Python, Ruby etc.)

Exemplo com fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Verifique se o gerenciador de versões está inicializado no arquivo de inicialização do seu shell (`~/.zshrc` ou `~/.bashrc`). Se não estiver, `openclaw` pode não ser encontrado em novas sessões do terminal porque o PATH não incluirá o diretório bin do Node.
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
        Adicione a saída de `npm prefix -g` ao PATH do sistema via Configurações → Sistema → Variáveis de Ambiente.
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

## Relacionado

- [Visão geral da instalação](/pt-BR/install) - todos os métodos de instalação
- [Atualização](/pt-BR/install/updating) - mantendo o OpenClaw atualizado
- [Primeiros passos](/pt-BR/start/getting-started) - primeiros passos após a instalação
