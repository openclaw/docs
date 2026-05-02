---
read_when:
    - Pesquisar, instalar ou atualizar Skills ou plugins
    - Publicação de Skills ou plugins no registro
    - Configurando a CLI do ClawHub ou suas sobrescritas de ambiente
sidebarTitle: ClawHub
summary: 'ClawHub: registro público para Skills e plugins do OpenClaw, fluxos de instalação nativos e a CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T21:05:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd422cb3e7e53fcc6d2b8a557ebc569debb0b470d5fcf141d90499c03fb4d7b3
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub é o registro público de **Skills e plugins do OpenClaw**.

- Use comandos nativos `openclaw` para pesquisar, instalar e atualizar Skills, e para instalar plugins do ClawHub.
- Use a CLI `clawhub` separada para fluxos de autenticação no registro, publicação, exclusão/restauração e sincronização.

Site: [clawhub.ai](https://clawhub.ai)

## Início rápido

<Steps>
  <Step title="Pesquisa">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Instalação">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Uso">
    Inicie uma nova sessão do OpenClaw — ela reconhece a nova skill.
  </Step>
  <Step title="Publicação (opcional)">
    Para fluxos autenticados pelo registro (publicar, sincronizar, gerenciar), instale
    a CLI `clawhub` separada:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Fluxos nativos do OpenClaw

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Comandos nativos `openclaw` instalam no seu workspace ativo e
    persistem metadados da origem para que chamadas futuras de `update` possam permanecer no ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` consulta o catálogo de plugins do ClawHub e imprime nomes
    de pacotes prontos para instalação. Use `clawhub:<package>` quando quiser resolução pelo ClawHub.
    Especificações de plugin simples compatíveis com npm são instaladas do npm durante a transição de lançamento:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` também é exclusivo do npm e é útil quando uma especificação poderia
    ser ambígua:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Instalações de Plugin validam a compatibilidade anunciada de `pluginApi` e
    `minGatewayVersion` antes da instalação do arquivo ser executada, então
    hosts incompatíveis falham de forma fechada antecipadamente em vez de instalar parcialmente
    o pacote. Quando uma versão de pacote publica um artefato ClawPack,
    o OpenClaw prefere o `.tgz` exato de pacote npm enviado, verifica o cabeçalho de
    digest do ClawHub e os bytes baixados, e registra o tipo de artefato, a integridade
    npm, o shasum npm, o nome do tarball e os metadados de digest do ClawPack para
    atualizações futuras. Versões de pacote mais antigas sem metadados ClawPack ainda usam o
    caminho legado de verificação de arquivo de pacote.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` aceita apenas famílias de plugins
instaláveis. Se um pacote do ClawHub for na verdade uma skill, o OpenClaw para e
aponta você para `openclaw skills install <slug>`.

Instalações anônimas de plugins do ClawHub também falham de forma fechada para pacotes privados.
Canais comunitários ou outros canais não oficiais ainda podem ser instalados, mas o OpenClaw
avisa para que operadores possam revisar a origem e a verificação antes de habilitá-los.
</Note>

## O que é o ClawHub

- Um registro público para Skills e plugins do OpenClaw.
- Um armazenamento versionado de pacotes de Skills e metadados.
- Uma superfície de descoberta para pesquisa, tags e sinais de uso.

Uma skill típica é um pacote versionado de arquivos que inclui:

- Um arquivo `SKILL.md` com a descrição principal e o uso.
- Configurações, scripts ou arquivos de suporte opcionais usados pela skill.
- Metadados como tags, resumo e requisitos de instalação.

O ClawHub usa metadados para impulsionar a descoberta e expor com segurança
os recursos das Skills. O registro acompanha sinais de uso (estrelas, downloads) para
melhorar o ranqueamento e a visibilidade. Cada publicação cria uma nova versão
semver, e o registro mantém o histórico de versões para que os usuários possam auditar
alterações.

## Workspace e carregamento de Skills

A CLI `clawhub` separada também instala Skills em `./skills` dentro
do seu diretório de trabalho atual. Se um workspace do OpenClaw estiver configurado,
`clawhub` usa esse workspace como fallback, a menos que você sobrescreva `--workdir`
(ou `CLAWHUB_WORKDIR`). O OpenClaw carrega Skills do workspace a partir de
`<workspace>/skills` e as reconhece na **próxima** sessão.

Se você já usa `~/.openclaw/skills` ou Skills incluídas, as Skills do workspace
têm precedência. Para mais detalhes sobre como Skills são carregadas,
compartilhadas e controladas, consulte [Skills](/pt-BR/tools/skills).

## Recursos do serviço

| Recurso                  | Observações                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Navegação pública          | Skills e seu conteúdo `SKILL.md` ficam publicamente visíveis.          |
| Pesquisa                   | Baseada em embeddings (pesquisa vetorial), não apenas palavras-chave.               |
| Versionamento               | Semver, changelogs e tags (incluindo `latest`).                  |
| Downloads                | Zip por versão.                                                    |
| Estrelas e comentários       | Feedback da comunidade.                                                 |
| Resumos de varredura de segurança  | Páginas de detalhes mostram o estado da varredura mais recente antes da instalação ou download. |
| Páginas de detalhes dos scanners     | Resultados do VirusTotal, ClawScan e análise estática têm links profundos.  |
| Painel de recuperação do proprietário | Publicadores podem ver em `/dashboard` conteúdo próprio retido por varredura.       |
| Novas varreduras solicitadas pelo proprietário  | Proprietários podem solicitar novas varreduras limitadas para recuperação de falsos positivos.     |
| Moderação               | Aprovações e auditorias.                                               |
| API amigável para CLI         | Adequada para automação e scripts.                              |

## Segurança e moderação

O ClawHub é aberto por padrão — qualquer pessoa pode enviar Skills, mas uma conta do GitHub
deve ter **pelo menos uma semana de idade** para publicar. Isso reduz
abusos sem bloquear contribuidores legítimos.

<AccordionGroup>
  <Accordion title="Varreduras de segurança">
    O ClawHub executa verificações de segurança automatizadas em Skills publicadas e lançamentos
    de plugins. Páginas públicas de detalhes resumem o resultado atual, e linhas de scanners
    vinculam a páginas de detalhes dedicadas para VirusTotal, ClawScan e análise estática.

    Lançamentos retidos por varredura ou bloqueados podem ficar indisponíveis no catálogo público e
    nas superfícies de instalação, enquanto ainda permanecem visíveis ao proprietário em `/dashboard`.

  </Accordion>
  <Accordion title="Relato">
    - Qualquer usuário conectado pode denunciar uma skill.
    - Motivos de denúncia são obrigatórios e registrados.
    - Cada usuário pode ter até 20 denúncias ativas ao mesmo tempo.
    - Skills com mais de 3 denúncias únicas são ocultadas automaticamente por padrão.

  </Accordion>
  <Accordion title="Moderação">
    - Moderadores podem ver Skills ocultas, reexibi-las, excluí-las ou banir usuários.
    - Abusar do recurso de denúncias pode resultar em banimentos de conta.
    - Tem interesse em se tornar moderador? Pergunte no Discord do OpenClaw e entre em contato com um moderador ou mantenedor.

  </Accordion>
</AccordionGroup>

## CLI do ClawHub

Você só precisa dela para fluxos autenticados pelo registro, como
publicação/sincronização.

### Opções globais

<ParamField path="--workdir <dir>" type="string">
  Diretório de trabalho. Padrão: diretório atual; usa o workspace do OpenClaw como fallback.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Diretório de Skills, relativo ao workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  URL base do site (login pelo navegador).
</ParamField>
<ParamField path="--registry <url>" type="string">
  URL base da API do registro.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Desativa prompts (não interativo).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Imprime a versão da CLI.
</ParamField>

### Comandos

<AccordionGroup>
  <Accordion title="Auth (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Opções de login:

    - `--token <token>` — cole um token de API.
    - `--label <label>` — rótulo armazenado para tokens de login pelo navegador (padrão: `CLI token`).
    - `--no-browser` — não abre um navegador (requer `--token`).

  </Accordion>
  <Accordion title="Pesquisa">
    ```bash
    clawhub search "query"
    ```

    Pesquisa Skills. Para descoberta de plugins/pacotes, use `clawhub package explore`.

    - `--limit <n>` — máximo de resultados.

  </Accordion>
  <Accordion title="Navegar / inspecionar plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` e `package inspect` são as superfícies da CLI do ClawHub para descoberta de plugins/pacotes e inspeção de metadados. Instalações nativas do OpenClaw ainda usam `openclaw plugins install clawhub:<package>`.

    Opções:

    - `--family skill|code-plugin|bundle-plugin` — filtra a família de pacotes.
    - `--official` — mostra apenas pacotes oficiais.
    - `--executes-code` — mostra apenas pacotes que executam código.
    - `--version <version>` / `--tag <tag>` — inspeciona uma versão específica do pacote.
    - `--versions`, `--files`, `--file <path>` — inspeciona o histórico e os arquivos do pacote.
    - `--json` — saída legível por máquina.

  </Accordion>
  <Accordion title="Instalar / atualizar / listar">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Opções:

    - `--version <version>` — instala ou atualiza para uma versão específica (apenas slug único em `update`).
    - `--force` — sobrescreve se a pasta já existir, ou quando arquivos locais não correspondem a nenhuma versão publicada.
    - `clawhub list` lê `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publicar Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Opções:

    - `--slug <slug>` — slug da skill.
    - `--name <name>` — nome de exibição.
    - `--version <version>` — versão semver.
    - `--changelog <text>` — texto do changelog (pode ficar vazio).
    - `--tags <tags>` — tags separadas por vírgula (padrão: `latest`).

  </Accordion>
  <Accordion title="Publicar plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` pode ser uma pasta local, `owner/repo`, `owner/repo@ref` ou uma
    URL do GitHub.

    Opções:

    - `--dry-run` — cria o plano de publicação exato sem enviar nada.
    - `--json` — emite saída legível por máquina para CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — substituições opcionais quando a detecção automática não é suficiente.

  </Accordion>
  <Accordion title="Solicitar novas varreduras">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Comandos de nova varredura exigem um token de proprietário autenticado e têm como alvo a versão
    de skill publicada mais recente ou o lançamento de plugin mais recente. Em execuções não interativas, passe
    `--yes`.

    Respostas JSON incluem o tipo, nome e versão do alvo, o status da nova varredura e
    as contagens restantes/máximas de solicitações para essa versão ou lançamento.

  </Accordion>
  <Accordion title="Excluir / restaurar (proprietário ou admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sincronizar (varrer local + publicar novo ou atualizado)">
    ```bash
    clawhub sync
    ```

    Opções:

    - `--root <dir...>` — raízes extras de varredura.
    - `--all` — envia tudo sem prompts.
    - `--dry-run` — mostra o que seria enviado.
    - `--bump <type>` — `patch|minor|major` para atualizações (padrão: `patch`).
    - `--changelog <text>` — changelog para atualizações não interativas.
    - `--tags <tags>` — tags separadas por vírgula (padrão: `latest`).
    - `--concurrency <n>` — verificações de registro (padrão: `4`).

  </Accordion>
</AccordionGroup>

## Fluxos de trabalho comuns

<Tabs>
  <Tab title="Pesquisa">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Encontrar um Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Instalar">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Atualizar tudo">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Publicar uma única skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Sincronizar muitas skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Publicar um Plugin do GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Metadados do pacote do Plugin

Plugins de código devem incluir os metadados obrigatórios do OpenClaw em
`package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Pacotes publicados devem incluir **JavaScript compilado** e apontar
`runtimeExtensions` para essa saída. Instalações por checkout do Git ainda podem
recorrer ao código-fonte TypeScript quando não existirem arquivos compilados, mas entradas de runtime
compiladas evitam a compilação TypeScript em tempo de execução nos caminhos de inicialização, doctor e
carregamento de Plugin.

## Versionamento, lockfile e telemetria

<AccordionGroup>
  <Accordion title="Versionamento e tags">
    - Cada publicação cria uma nova `SkillVersion` **semver**.
    - Tags (como `latest`) apontam para uma versão; mover tags permite reverter.
    - Changelogs são anexados por versão e podem ficar vazios ao sincronizar ou publicar atualizações.

  </Accordion>
  <Accordion title="Alterações locais vs versões do registro">
    As atualizações comparam o conteúdo local da skill com as versões do registro usando um
    hash de conteúdo. Se os arquivos locais não corresponderem a nenhuma versão publicada, a
    CLI pergunta antes de sobrescrever (ou exige `--force` em
    execuções não interativas).
  </Accordion>
  <Accordion title="Varredura de sincronização e raízes alternativas">
    `clawhub sync` examina primeiro o diretório de trabalho atual. Se nenhuma skill for
    encontrada, ele recorre a locais legados conhecidos (por exemplo,
    `~/openclaw/skills` e `~/.openclaw/skills`). Isso foi projetado para
    encontrar instalações antigas de skills sem flags extras.
  </Accordion>
  <Accordion title="Armazenamento e lockfile">
    - Skills instaladas são registradas em `.clawhub/lock.json` no seu diretório de trabalho.
    - Tokens de autenticação são armazenados no arquivo de configuração da CLI do ClawHub (substitua via `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetria (contagens de instalação)">
    Quando você executa `clawhub sync` estando logado, a CLI envia um snapshot
    mínimo para calcular contagens de instalação. Você pode desativar isso completamente:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente

| Variável                      | Efeito                                             |
| ----------------------------- | -------------------------------------------------- |
| `CLAWHUB_SITE`                | Substitui a URL do site.                           |
| `CLAWHUB_REGISTRY`            | Substitui a URL da API do registro.                |
| `CLAWHUB_CONFIG_PATH`         | Substitui onde a CLI armazena o token/configuração. |
| `CLAWHUB_WORKDIR`             | Substitui o diretório de trabalho padrão.          |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Desativa a telemetria em `sync`.                   |

## Relacionado

- [Plugins da comunidade](/pt-BR/plugins/community)
- [Plugins](/pt-BR/tools/plugin)
- [Skills](/pt-BR/tools/skills)
