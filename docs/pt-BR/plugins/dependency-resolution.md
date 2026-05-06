---
read_when:
    - Você está depurando instalações de pacotes de Plugin
    - Você está alterando o comportamento de inicialização de Plugin, de diagnóstico ou de instalação pelo gerenciador de pacotes
    - Você está mantendo instalações empacotadas do OpenClaw ou manifestos de Plugin incluídos
sidebarTitle: Dependencies
summary: Como o OpenClaw instala pacotes de Plugin e resolve dependências de Plugin
title: Resolução de dependências de Plugin
x-i18n:
    generated_at: "2026-05-06T17:58:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15cdc75d92a675fd5474c49572639ab7510618e393fb7cf9f8b94506c859bee8
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw mantém o trabalho de dependências de plugins no momento da instalação/atualização. O carregamento em tempo de execução
não executa gerenciadores de pacotes, repara árvores de dependências nem altera o diretório de pacotes do OpenClaw.

## Divisão de responsabilidades

Os pacotes de plugin são responsáveis pelo próprio grafo de dependências:

- dependências de tempo de execução ficam em `dependencies` ou
  `optionalDependencies` do pacote de plugin
- imports de SDK/core são peers ou imports fornecidos pelo OpenClaw
- plugins de desenvolvimento local trazem suas próprias dependências já instaladas
- plugins npm e git são instalados em raízes de pacotes pertencentes ao OpenClaw

OpenClaw é responsável apenas pelo ciclo de vida do plugin:

- descobrir a origem do plugin
- instalar ou atualizar o pacote quando solicitado explicitamente
- registrar os metadados de instalação
- carregar o ponto de entrada do plugin
- falhar com um erro acionável quando dependências estiverem ausentes

## Raízes de instalação

OpenClaw usa raízes estáveis por origem:

- pacotes npm são instalados em `~/.openclaw/npm`
- pacotes git são clonados em `~/.openclaw/git`
- instalações locais/por caminho/arquivo são copiadas ou referenciadas sem reparo de dependências

Instalações npm são executadas na raiz npm com:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa essa mesma raiz npm gerenciada
para um tarball npm-pack local. OpenClaw lê os metadados npm do tarball, adiciona-o
à raiz gerenciada como uma dependência `file:` copiada, executa a instalação npm normal
e então verifica os metadados do lockfile instalado antes de confiar no plugin.
Isso é destinado a provas de aceitação de pacote e de candidato a release, em que um
artefato local de pacote deve se comportar como o artefato de registro que ele simula.

O npm pode içar dependências transitivas para `~/.openclaw/npm/node_modules` ao lado
do pacote de plugin. OpenClaw examina a raiz npm gerenciada antes de confiar na
instalação e usa npm para remover pacotes gerenciados por npm durante a desinstalação, para que as dependências
de tempo de execução içadas permaneçam dentro do limite de limpeza gerenciado.

Plugins que importam `openclaw/plugin-sdk/*` declaram `openclaw` como dependência peer.
OpenClaw não permite que npm instale uma cópia separada do pacote host a partir do registro
na raiz gerenciada, porque pacotes host obsoletos podem afetar a resolução de peers do npm
durante instalações posteriores de plugins. Em vez disso, depois que o npm termina
de alterar a raiz compartilhada durante instalação, atualização ou desinstalação, OpenClaw reafirma
links `node_modules/openclaw` locais ao plugin para pacotes instalados que declaram
o peer do host.

Instalações git clonam ou atualizam o repositório e então executam:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

O plugin instalado então é carregado a partir desse diretório de pacote, de modo que a resolução
local ao pacote e no `node_modules` pai funcione da mesma forma que em um pacote
Node normal.

## Plugins locais

Plugins locais são tratados como diretórios controlados pelo desenvolvedor. OpenClaw não
executa `npm install`, `pnpm install` nem reparo de dependências para eles. Se um
plugin local tiver dependências, instale-as nesse plugin antes de carregá-lo.

Plugins TypeScript locais de terceiros podem usar o caminho emergencial do Jiti. Plugins
JavaScript empacotados e plugins internos incluídos carregam por import/require nativo
em vez de Jiti.

## Inicialização e recarregamento

A inicialização do Gateway e o recarregamento de configuração nunca instalam dependências de plugins. Eles leem
os registros de instalação de plugins, calculam o ponto de entrada e o carregam.

Se uma dependência estiver ausente em tempo de execução, o plugin falha ao carregar, e o erro
deve orientar o operador para uma correção explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` pode limpar estado legado de dependências gerado pelo OpenClaw e recuperar
plugins baixáveis ausentes dos registros de instalação locais quando a configuração
os referencia. O Doctor não repara dependências para um plugin local já instalado.

## Plugins incluídos

Plugins incluídos leves e críticos para o core são enviados como parte do OpenClaw.
Eles devem não ter uma árvore pesada de dependências de tempo de execução ou ser movidos para um
pacote baixável no ClawHub/npm.

Para a lista gerada atual de plugins enviados no pacote core, instalados
externamente ou mantidos apenas no código-fonte, consulte [Inventário de plugins](/pt-BR/plugins/plugin-inventory).

Manifestos de plugins incluídos não devem solicitar preparação de dependências. Funcionalidades
grandes ou opcionais de plugins devem ser empacotadas como um plugin normal e instaladas pelo
mesmo caminho npm/git/ClawHub que plugins de terceiros.

Em checkouts de código-fonte, OpenClaw trata o repositório como um monorepo pnpm. Depois de
`pnpm install`, plugins incluídos são carregados de `extensions/<id>`, para que dependências
de workspace locais ao pacote fiquem disponíveis e edições sejam captadas diretamente. O desenvolvimento
em checkout de código-fonte é somente pnpm; `npm install` simples na raiz do repositório não é
uma forma compatível de preparar dependências de plugins incluídos.

| Formato de instalação            | Local do plugin incluído              | Responsável pelas dependências                                      |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árvore de runtime compilada dentro do pacote | Pacote OpenClaw e fluxos explícitos de instalação/atualização/doctor de plugins |
| Checkout Git mais `pnpm install` | Pacotes de workspace `extensions/<id>` | O workspace pnpm, incluindo as próprias dependências de cada pacote de plugin |
| `openclaw plugins install ...`   | Raiz gerenciada de plugin npm/git/ClawHub | O fluxo de instalação/atualização de plugins                         |

## Limpeza legada

Versões mais antigas do OpenClaw geravam raízes de dependências de plugins incluídos na inicialização ou
durante reparo pelo doctor. A limpeza atual do doctor remove esses diretórios e
symlinks obsoletos quando `--fix` é usado, incluindo raízes antigas `plugin-runtime-deps`, symlinks
globais de pacotes de prefixo Node que apontam para destinos `plugin-runtime-deps` podados,
manifestos `.openclaw-runtime-deps*`, `node_modules` de plugins gerados, diretórios de estágio
de instalação e stores pnpm locais ao pacote. O postinstall empacotado também
remove esses symlinks globais antes de podar as raízes de destino legadas, para que upgrades
não deixem imports pendentes de pacotes ESM.

Esses caminhos são apenas resíduos legados. Novas instalações não devem criá-los.
