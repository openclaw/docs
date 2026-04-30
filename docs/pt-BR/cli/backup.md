---
read_when:
    - Você quer um arquivo de backup de primeira classe para o estado local do OpenClaw
    - Você quer pré-visualizar quais caminhos seriam incluídos antes de redefinir ou desinstalar
summary: Referência da CLI para `openclaw backup` (criar arquivos de backup locais)
title: Cópia de segurança
x-i18n:
    generated_at: "2026-04-30T09:39:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c16f953bb32a1613181448f0e4c6ba8777383bce95bddc856dc7e1c3afe8550
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Crie um arquivo de backup local para o estado, a configuração, os perfis de autenticação, as credenciais de canais/provedores, as sessões e, opcionalmente, os espaços de trabalho do OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Observações

- O arquivo inclui um arquivo `manifest.json` com os caminhos de origem resolvidos e o layout do arquivo.
- A saída padrão é um arquivo `.tar.gz` com carimbo de data/hora no diretório de trabalho atual.
- Se o diretório de trabalho atual estiver dentro de uma árvore de origem incluída no backup, o OpenClaw usa seu diretório inicial como fallback para o local padrão do arquivo.
- Arquivos de backup existentes nunca são sobrescritos.
- Caminhos de saída dentro das árvores de estado/espaço de trabalho de origem são rejeitados para evitar auto-inclusão.
- `openclaw backup verify <archive>` valida que o arquivo contém exatamente um manifesto raiz, rejeita caminhos de arquivo no estilo travessia e verifica se cada payload declarado no manifesto existe no tarball.
- `openclaw backup create --verify` executa essa validação imediatamente após gravar o arquivo.
- `openclaw backup create --only-config` faz backup apenas do arquivo de configuração JSON ativo.

## O que é incluído no backup

`openclaw backup create` planeja as origens de backup a partir da sua instalação local do OpenClaw:

- O diretório de estado retornado pelo resolvedor de estado local do OpenClaw, geralmente `~/.openclaw`
- O caminho do arquivo de configuração ativo
- O diretório `credentials/` resolvido quando ele existe fora do diretório de estado
- Diretórios de espaços de trabalho descobertos a partir da configuração atual, a menos que você passe `--no-include-workspace`

Os perfis de autenticação de modelos já fazem parte do diretório de estado em
`agents/<agentId>/agent/auth-profiles.json`, portanto normalmente são cobertos pela
entrada de backup de estado.

Se você usar `--only-config`, o OpenClaw ignora a descoberta de estado, diretório de credenciais e espaços de trabalho e arquiva apenas o caminho do arquivo de configuração ativo.

O OpenClaw canonicaliza os caminhos antes de criar o arquivo. Se a configuração, o
diretório de credenciais ou um espaço de trabalho já estiverem dentro do diretório de estado,
eles não são duplicados como origens de backup separadas de nível superior. Caminhos ausentes são
ignorados.

O payload do arquivo armazena o conteúdo dos arquivos dessas árvores de origem, e o `manifest.json` incorporado registra os caminhos absolutos de origem resolvidos, além do layout do arquivo usado para cada ativo.

Arquivos de origem e manifesto de plugins instalados sob a árvore
`extensions/` do diretório de estado são incluídos, mas suas árvores de dependências
`node_modules/` aninhadas são ignoradas. Essas dependências são artefatos de instalação reconstruíveis; após
restaurar um arquivo, use `openclaw plugins update <id>` ou reinstale o plugin
com `openclaw plugins install <spec> --force` quando um plugin restaurado relatar
dependências ausentes.

## Comportamento de configuração inválida

`openclaw backup` ignora intencionalmente a pré-verificação normal de configuração para ainda poder ajudar durante a recuperação. Como a descoberta de espaços de trabalho depende de uma configuração válida, `openclaw backup create` agora falha rapidamente quando o arquivo de configuração existe, mas é inválido, e o backup de espaços de trabalho ainda está habilitado.

Se você ainda quiser um backup parcial nessa situação, execute novamente:

```bash
openclaw backup create --no-include-workspace
```

Isso mantém estado, configuração e o diretório de credenciais externo no escopo enquanto
ignora completamente a descoberta de espaços de trabalho.

Se você precisar apenas de uma cópia do próprio arquivo de configuração, `--only-config` também funciona quando a configuração está malformada, porque não depende da análise da configuração para descoberta de espaços de trabalho.

## Tamanho e desempenho

O OpenClaw não impõe um tamanho máximo de backup integrado nem um limite de tamanho por arquivo.

Os limites práticos vêm da máquina local e do sistema de arquivos de destino:

- Espaço disponível para a gravação temporária do arquivo mais o arquivo final
- Tempo para percorrer grandes árvores de espaços de trabalho e compactá-las em um `.tar.gz`
- Tempo para varrer novamente o arquivo se você usar `openclaw backup create --verify` ou executar `openclaw backup verify`
- Comportamento do sistema de arquivos no caminho de destino. O OpenClaw prefere uma etapa de publicação por hard link sem sobrescrita e usa cópia exclusiva como fallback quando hard links não são compatíveis

Espaços de trabalho grandes geralmente são o principal fator do tamanho do arquivo. Se você quiser um backup menor ou mais rápido, use `--no-include-workspace`.

Para o menor arquivo, use `--only-config`.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
