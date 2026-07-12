---
read_when:
    - Depuração de solicitações de permissão do macOS ausentes ou travadas
    - Decidindo se deve conceder Acessibilidade ao Node ou a um ambiente de execução da CLI
    - Empacotamento ou assinatura do app para macOS
    - Alteração de IDs de pacote ou caminhos de instalação do aplicativo
summary: Persistência de permissões do macOS (TCC) e requisitos de assinatura
title: permissões do macOS
x-i18n:
    generated_at: "2026-07-12T15:26:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c8431a1d5a27aed00c50c5d6c8c36554cf766051dfdccea677d0523bbc4189d4
    source_path: platforms/mac/permissions.md
    workflow: 16
---

As concessões de permissões do macOS são frágeis. O TCC associa uma concessão de permissão à assinatura de código do aplicativo, ao identificador do pacote e ao caminho no disco. Se qualquer um deles mudar, o macOS tratará o aplicativo como novo e poderá descartar ou ocultar as solicitações.

## Requisitos para permissões estáveis

- Mesmo caminho: execute o aplicativo a partir de um local fixo (para o OpenClaw, `dist/OpenClaw.app`).
- Mesmo identificador do pacote: o ID do pacote do OpenClaw é `ai.openclaw.mac`; alterá-lo cria uma nova identidade de permissão.
- Aplicativo assinado: builds sem assinatura ou com assinatura ad hoc não mantêm as permissões.
- Assinatura consistente: use um certificado Apple Development ou Developer ID válido para que a assinatura permaneça estável entre os builds.

Assinaturas ad hoc geram uma nova identidade a cada build. O macOS esquece as concessões anteriores, e as solicitações podem desaparecer por completo até que as entradas obsoletas sejam removidas.

## Concessões de Acessibilidade para ambientes de execução Node e CLI

Prefira conceder Acessibilidade ao OpenClaw.app, Peekaboo.app ou a outro auxiliar assinado com seu próprio identificador de pacote, em vez de concedê-la a um binário `node` genérico.

O TCC do macOS concede Acessibilidade à identidade de código do processo que ele identifica. Se um fluxo de trabalho do Homebrew, nvm, pnpm ou npm fizer com que um executável `node` compartilhado receba Acessibilidade, qualquer pacote JavaScript iniciado por meio desse mesmo executável poderá herdar privilégios de automação da interface gráfica.

Considere uma entrada `node` nos Ajustes do Sistema como uma permissão ampla para esse ambiente de execução Node, não como uma permissão para um único pacote npm. Evite conceder Acessibilidade ao `node`, a menos que você confie em todos os scripts e pacotes iniciados por meio dessa instalação específica do Node.

Se você concedeu Acessibilidade ao `node` acidentalmente, remova essa entrada em System Settings -> Privacy & Security -> Accessibility. Em seguida, conceda a permissão ao aplicativo ou auxiliar assinado que deve controlar a automação da interface.

## Lista de verificação para recuperação quando as solicitações desaparecem

1. Encerre o aplicativo.
2. Remova a entrada do aplicativo em System Settings -> Privacy & Security.
3. Reinicie o aplicativo a partir do mesmo caminho e conceda novamente as permissões.
4. Se a solicitação ainda não aparecer, redefina as entradas do TCC com `tccutil` e tente novamente.
5. Algumas permissões só reaparecem após uma reinicialização completa do macOS.

Exemplos de redefinição (usando o ID do pacote do OpenClaw, `ai.openclaw.mac`):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Permissões de arquivos e pastas (Mesa/Documentos/Downloads)

O macOS também pode restringir o acesso à Mesa, aos Documentos e aos Downloads para processos de terminal ou executados em segundo plano. Se a leitura de arquivos ou a listagem de diretórios travar, conceda acesso ao mesmo contexto de processo que executa as operações de arquivo (por exemplo, Terminal/iTerm, um aplicativo iniciado pelo LaunchAgent ou um processo SSH).

Solução alternativa: mova os arquivos para o espaço de trabalho do OpenClaw (`~/.openclaw/workspace`) se quiser evitar concessões específicas para cada pasta.

Se você estiver testando permissões, sempre assine com um certificado válido. Builds ad hoc são aceitáveis apenas para execuções locais rápidas nas quais as permissões não sejam importantes.

## Relacionado

- [Aplicativo para macOS](/pt-BR/platforms/macos)
- [Assinatura no macOS](/pt-BR/platforms/mac/signing)
