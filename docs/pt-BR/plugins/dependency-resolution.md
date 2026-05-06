---
read_when:
    - Você está depurando instalações de pacotes de Plugin
    - Você está alterando o comportamento de inicialização de Plugin, de doctor ou de instalação do gerenciador de pacotes
    - Você está mantendo instalações empacotadas do OpenClaw ou manifestos de Plugin integrados
sidebarTitle: Dependencies
summary: Como o OpenClaw instala pacotes de Plugin e resolve dependências de Plugin
title: Resolução de dependências de Plugin
x-i18n:
    generated_at: "2026-05-06T19:35:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: d51785b67d491d09e3a7a3ffcd6c991f7415c46b207596151dbc29b0c43e9341
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw mantém o trabalho de dependências de plugins no momento de instalação/atualização. O carregamento em runtime
não executa gerenciadores de pacotes, repara árvores de dependências nem modifica o diretório de pacote do OpenClaw.

## Divisão de responsabilidades

Os pacotes de plugins são responsáveis pelo próprio grafo de dependências:

- dependências de runtime ficam em `dependencies` ou
  `optionalDependencies` no pacote do plugin
- importações do SDK/core são importações peer ou fornecidas pelo OpenClaw
- plugins de desenvolvimento local trazem suas próprias dependências já instaladas
- plugins npm e git são instalados em raízes de pacote pertencentes ao OpenClaw

O OpenClaw é responsável apenas pelo ciclo de vida do plugin:

- descobrir a origem do plugin
- instalar ou atualizar o pacote quando solicitado explicitamente
- registrar os metadados da instalação
- carregar o ponto de entrada do plugin
- falhar com um erro acionável quando dependências estiverem ausentes

## Raízes de instalação

O OpenClaw usa raízes estáveis por origem:

- pacotes npm são instalados em `~/.openclaw/npm`
- pacotes git são clonados em `~/.openclaw/git`
- instalações locais/por caminho/arquivo são copiadas ou referenciadas sem reparo de dependências

Instalações npm rodam na raiz npm com:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa essa mesma raiz npm gerenciada
para um tarball npm-pack local. O OpenClaw lê os metadados npm do tarball, adiciona-o
à raiz gerenciada como uma dependência `file:` copiada, executa a instalação npm normal
e então verifica os metadados do lockfile instalado antes de confiar no plugin.
Isso é destinado a provas de aceitação de pacote e candidatos a release em que um
artefato pack local deve se comportar como o artefato de registro que ele simula.

O npm pode elevar dependências transitivas para `~/.openclaw/npm/node_modules` ao lado
do pacote do plugin. O OpenClaw examina a raiz npm gerenciada antes de confiar na
instalação e usa npm para remover pacotes gerenciados por npm durante a desinstalação, então dependências
de runtime elevadas permanecem dentro do limite de limpeza gerenciada.

Plugins que importam `openclaw/plugin-sdk/*` declaram `openclaw` como uma dependência peer.
O OpenClaw não permite que o npm instale uma cópia separada do pacote hospedeiro vinda do registro
na raiz gerenciada, porque pacotes hospedeiros obsoletos podem afetar a resolução peer do npm
durante instalações posteriores de plugins. Instalações npm gerenciadas pulam a resolução/materialização peer do npm
para a raiz compartilhada, e o OpenClaw reafirma links `node_modules/openclaw` locais do plugin
para pacotes instalados que declaram o peer hospedeiro após instalar, atualizar ou desinstalar.

Instalações git clonam ou atualizam o repositório e então executam:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

O plugin instalado então é carregado a partir desse diretório de pacote, então a resolução de
`node_modules` local do pacote e pai funciona da mesma forma que para um pacote Node normal.

## Plugins locais

Plugins locais são tratados como diretórios controlados pelo desenvolvedor. O OpenClaw não
executa `npm install`, `pnpm install` nem reparo de dependências para eles. Se um
plugin local tiver dependências, instale-as nesse plugin antes de carregá-lo.

Plugins locais TypeScript de terceiros podem usar o caminho emergencial do Jiti. Plugins
JavaScript empacotados e plugins internos incluídos carregam por import/require nativo
em vez de Jiti.

## Inicialização e recarregamento

A inicialização do Gateway e o recarregamento de configuração nunca instalam dependências de plugins. Eles leem
os registros de instalação do plugin, calculam o ponto de entrada e o carregam.

Se uma dependência estiver ausente em runtime, o plugin falha ao carregar e o erro
deve apontar o operador para uma correção explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` pode limpar estado de dependências legado gerado pelo OpenClaw e recuperar
plugins baixáveis que estão ausentes dos registros de instalação locais quando a configuração
os referencia. O Doctor não repara dependências para um plugin local já instalado.

## Plugins incluídos

Plugins incluídos leves e críticos para o core são distribuídos como parte do OpenClaw.
Eles devem não ter uma árvore pesada de dependências de runtime ou ser movidos para um
pacote baixável no ClawHub/npm.

Para a lista gerada atual de plugins que são distribuídos no pacote core, instalados
externamente ou mantidos apenas como código-fonte, consulte [Inventário de plugins](/pt-BR/plugins/plugin-inventory).

Manifestos de plugins incluídos não devem solicitar preparação de dependências. Funcionalidade grande ou opcional
de plugin deve ser empacotada como um plugin normal e instalada pelo mesmo caminho
npm/git/ClawHub que plugins de terceiros.

Em checkouts de código-fonte, o OpenClaw trata o repositório como um monorepo pnpm. Após
`pnpm install`, plugins incluídos carregam a partir de `extensions/<id>`, para que dependências
workspace locais do pacote fiquem disponíveis e edições sejam incorporadas diretamente. Desenvolvimento em
checkout de código-fonte usa somente pnpm; `npm install` simples na raiz do repositório não é
uma forma compatível de preparar dependências de plugins incluídos.

| Formato de instalação            | Local do plugin incluído              | Responsável pelas dependências                                       |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árvore de runtime construída dentro do pacote | Pacote OpenClaw e fluxos explícitos de install/update/doctor de plugins |
| Checkout git mais `pnpm install` | Pacotes workspace em `extensions/<id>` | O workspace pnpm, incluindo as próprias dependências de cada pacote de plugin |
| `openclaw plugins install ...`   | Raiz gerenciada de plugin npm/git/ClawHub | O fluxo de install/update do plugin                                  |

## Limpeza legada

Versões antigas do OpenClaw geravam raízes de dependências de plugins incluídos na inicialização ou
durante reparo do doctor. A limpeza atual do doctor remove esses diretórios e
symlinks obsoletos quando `--fix` é usado, incluindo raízes antigas `plugin-runtime-deps`, symlinks de pacote de
prefixo Node global que apontam para destinos `plugin-runtime-deps` podados,
manifestos `.openclaw-runtime-deps*`, `node_modules` de plugin gerado, diretórios de
estágio de instalação e stores pnpm locais de pacote. O postinstall empacotado também
remove esses symlinks globais antes de podar as raízes de destino legadas, para que upgrades
não deixem importações de pacote ESM pendentes.

Esses caminhos são apenas resíduos legados. Novas instalações não devem criá-los.
