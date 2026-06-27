---
read_when:
    - Você quer um arquivo de backup de primeira classe para o estado local do OpenClaw
    - Você quer visualizar quais caminhos seriam incluídos antes de redefinir ou desinstalar
summary: Referência da CLI para `openclaw backup` (criar arquivos de backup locais)
title: Cópia de segurança
x-i18n:
    generated_at: "2026-06-27T17:18:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ac7d8e4babd24f1c46ac48dca6c413e12361173df83cfe485dd3945ccd30c3e
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Crie um arquivo de backup local para estado, configuração, perfis de autenticação, credenciais de canais/provedores, sessões e, opcionalmente, espaços de trabalho do OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## Observações

- O arquivo inclui um arquivo `manifest.json` com os caminhos de origem resolvidos e o layout do arquivo.
- A saída padrão é um arquivo `.tar.gz` com carimbo de data/hora no diretório de trabalho atual.
- Nomes de arquivos de backup com carimbo de data/hora usam o fuso horário local da sua máquina e incluem o deslocamento UTC.
- Se o diretório de trabalho atual estiver dentro de uma árvore de origem incluída no backup, o OpenClaw volta para o seu diretório inicial como local padrão do arquivo.
- Arquivos existentes nunca são sobrescritos.
- Caminhos de saída dentro das árvores de estado/espaço de trabalho de origem são rejeitados para evitar autoinclusão.
- `openclaw backup verify <archive>` valida que o arquivo contém exatamente um manifesto raiz, rejeita caminhos de arquivo no estilo de travessia de diretórios e verifica se cada payload declarado no manifesto existe no tarball.
- `openclaw backup create --verify` executa essa validação imediatamente depois de gravar o arquivo.
- `openclaw backup create --only-config` faz backup apenas do arquivo de configuração JSON ativo.

## O que é incluído no backup

`openclaw backup create` planeja fontes de backup a partir da sua instalação local do OpenClaw:

- O diretório de estado retornado pelo resolvedor de estado local do OpenClaw, geralmente `~/.openclaw`
- O caminho do arquivo de configuração ativo
- O diretório `credentials/` resolvido quando ele existe fora do diretório de estado
- Diretórios de espaço de trabalho descobertos a partir da configuração atual, a menos que você passe `--no-include-workspace`

Perfis de autenticação de modelos já fazem parte do diretório de estado em
`agents/<agentId>/agent/auth-profiles.json`, então normalmente são cobertos pela
entrada de backup de estado.

Se você usar `--only-config`, o OpenClaw ignora a descoberta de estado, diretório de credenciais e espaços de trabalho e arquiva apenas o caminho do arquivo de configuração ativo.

O OpenClaw canonicaliza os caminhos antes de criar o arquivo. Se a configuração, o
diretório de credenciais ou um espaço de trabalho já estiverem dentro do diretório
de estado, eles não serão duplicados como fontes de backup separadas de nível superior. Caminhos ausentes são
ignorados.

O payload do arquivo armazena o conteúdo dos arquivos dessas árvores de origem, e o `manifest.json` incorporado registra os caminhos de origem absolutos resolvidos, além do layout do arquivo usado para cada ativo.

Durante a criação do arquivo, o OpenClaw ignora arquivos conhecidos de mutação ao vivo que não têm valor de restauração, incluindo transcrições de sessões de agentes ativos, logs de execuções de Cron, logs rotativos, filas de entrega, arquivos de socket/pid/temporários sob o diretório de estado e arquivos temporários relacionados de filas duráveis. O resultado JSON inclui `skippedVolatileCount` para que automações possam ver quantos arquivos foram omitidos intencionalmente.

Arquivos de origem e manifesto de Plugin instalados sob a árvore
`extensions/` do diretório de estado são incluídos, mas suas árvores de dependências
`node_modules/` aninhadas são ignoradas. Essas dependências são artefatos de instalação reconstruíveis; depois de
restaurar um arquivo, use `openclaw plugins update <id>` ou reinstale o Plugin
com `openclaw plugins install <spec> --force` quando um Plugin restaurado relatar
dependências ausentes.

## Comportamento com configuração inválida

`openclaw backup` ignora intencionalmente a pré-verificação normal de configuração para ainda poder ajudar durante a recuperação. Como a descoberta de espaços de trabalho depende de uma configuração válida, `openclaw backup create` agora falha rapidamente quando o arquivo de configuração existe, mas é inválido, e o backup de espaços de trabalho ainda está habilitado.

Se você ainda quiser um backup parcial nessa situação, execute novamente:

```bash
openclaw backup create --no-include-workspace
```

Isso mantém estado, configuração e o diretório externo de credenciais no escopo, enquanto
ignora totalmente a descoberta de espaços de trabalho.

Se você precisa apenas de uma cópia do arquivo de configuração em si, `--only-config` também funciona quando a configuração está malformada, porque não depende da análise da configuração para descoberta de espaços de trabalho.

## Tamanho e desempenho

O OpenClaw não impõe um tamanho máximo de backup integrado nem um limite de tamanho por arquivo.

Os limites práticos vêm da máquina local e do sistema de arquivos de destino:

- Espaço disponível para a gravação temporária do arquivo, além do arquivo final
- Tempo para percorrer grandes árvores de espaços de trabalho e compactá-las em um `.tar.gz`
- Tempo para verificar novamente o arquivo se você usar `openclaw backup create --verify` ou executar `openclaw backup verify`
- Comportamento do sistema de arquivos no caminho de destino. O OpenClaw prefere uma etapa de publicação sem sobrescrita por hard link e recorre à cópia exclusiva quando hard links não são compatíveis

Espaços de trabalho grandes geralmente são o principal fator do tamanho do arquivo. Se você quiser um backup menor ou mais rápido, use `--no-include-workspace`.

Para o menor arquivo, use `--only-config`.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
