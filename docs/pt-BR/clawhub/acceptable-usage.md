---
read_when:
    - Analisando uploads em busca de abuso ou violações de políticas
    - Redação de documentação de moderação ou guias operacionais para revisores
    - Decidir se uma skill deve ser ocultada ou se um usuário deve ser banido
sidebarTitle: Acceptable Usage
summary: 'Política do marketplace: o que o ClawHub permite e o que ele não hospedará.'
title: Uso aceitável
x-i18n:
    generated_at: "2026-07-16T12:15:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceitável

O ClawHub hospeda Skills, plugins, pacotes e metadados de marketplace para o OpenClaw.
Use esta página para decidir se um conteúdo ou comportamento de publicação pertence ao
ClawHub.

Estas regras se aplicam ao que uma listagem faz, ao que ela solicita que os usuários executem, à forma como
se apresenta e à maneira como os editores usam as superfícies de descoberta, instalação e
confiança do ClawHub. Para estados de moderação e situação da conta, consulte
[Moderação e segurança da conta](/clawhub/moderation). Para reivindicações de direitos autorais ou outros direitos,
consulte [Solicitações de direitos sobre conteúdo](/clawhub/content-rights).

## Conteúdo permitido

O ClawHub aceita conteúdo que seja útil, compreensível e publicado de
boa-fé.

| Categoria                                         | Permitido quando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produtividade para desenvolvedores                           | A listagem ajuda os usuários a criar, testar, migrar, depurar, documentar ou operar software.                                               |
| Fluxos de trabalho de interface, dados e automação               | O escopo é claro, as credenciais necessárias são explícitas e as ações arriscadas incluem caminhos de revisão, simulação, visualização prévia ou confirmação. |
| Segurança defensiva, moderação e análise de abuso | A ferramenta é apresentada para análises autorizadas, preserva evidências e mantém claros os limites de aprovação humana.                          |
| Fluxos de trabalho pessoais ou de equipe                       | O fluxo de trabalho usa contas baseadas em consentimento, configuração transparente e permissões explícitas.                                            |
| Catálogos mantidos                              | Cada listagem é distinta, útil, descrita com precisão e mantida de forma razoável.                                                |

O contexto importa. O mesmo tema pode ser aceitável em um cenário defensivo restrito ou
baseado em consentimento e inaceitável quando empacotado como um fluxo de trabalho de abuso.

## Conteúdo proibido

O ClawHub não hospeda conteúdo cujo principal propósito seja abuso, fraude, execução
insegura ou violação de direitos.

| Categoria                                                    | Não permitido                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acesso não autorizado ou evasão de segurança                      | Evasão de autenticação, tomada de conta, abuso de limites de taxa, tomada de chamadas ao vivo ou de agentes, roubo de sessões reutilizáveis ou aprovação automática de fluxos de pareamento para usuários não aprovados.                                                                                                                                                   |
| Abuso de plataforma e evasão de banimento                              | Contas dissimuladas após banimentos, aquecimento ou cultivo de contas, engajamento falso, automação de várias contas, publicações em massa, bots de spam ou automação criada para evitar detecção.                                                                                                                                          |
| Fraude, golpes e fluxos de trabalho financeiros enganosos             | Certificados ou faturas falsos, fluxos de pagamento enganosos, abordagem para golpes, prova social falsa, fluxos de trabalho com identidades sintéticas para fraude ou ferramentas de gastos/cobranças sem aprovação humana clara.                                                                                                                    |
| Enriquecimento invasivo de privacidade ou vigilância                 | Coleta de contatos para spam, exposição de dados pessoais, perseguição, extração de leads combinada com abordagens não solicitadas, monitoramento oculto, correspondência biométrica sem consentimento ou uso de dados vazados ou despejos de violações.                                                                                                                  |
| Personificação ou manipulação de identidade sem consentimento       | Troca de rostos, gêmeos digitais, influenciadores clonados, personas falsas ou outras ferramentas usadas para personificar ou enganar.                                                                                                                                                                                                 |
| Conteúdo sexual explícito ou geração adulta com recursos de segurança desativados | Geração de imagens, vídeos ou conteúdo NSFW; wrappers de conteúdo adulto para APIs de terceiros; ou listagens cujo principal propósito seja conteúdo sexual explícito.                                                                                                                                                       |
| Requisitos de execução ocultos, inseguros ou enganosos        | Comandos de instalação ofuscados, instaladores que redirecionam conteúdo baixado diretamente para o shell, como conteúdo executado com `sh` ou `bash`, sem possibilidade clara de revisão, requisitos não declarados de segredos ou chaves privadas, execução remota de `npx @latest` sem possibilidade clara de revisão ou metadados que ocultam o que a listagem realmente precisa para ser executada. |
| Material que viola direitos autorais ou outros direitos           | Republicação da Skill, do plugin, da documentação, dos ativos de marca ou do código proprietário de outra pessoa sem permissão; violação dos termos de licença; ou personificação do autor ou editor original.                                                                                                                            |

## Comportamento proibido no marketplace

O ClawHub também analisa como os editores usam o marketplace. Não use o ClawHub para
manipular a descoberta, métricas, sinais de confiança, sistemas de moderação ou a
atenção dos usuários.

Comportamentos proibidos no marketplace incluem:

- publicar em massa grandes quantidades de listagens de baixo esforço, duplicadas, provisórias ou
  geradas por máquina que não pareçam ter valor real para os usuários
- inundar superfícies de pesquisa ou categorias com Skills ou plugins quase idênticos
- publicar centenas de listagens com pouco ou nenhum uso, manutenção, clareza
  da fonte ou diferenciação significativa
- inflar artificialmente instalações, downloads, estrelas ou outras métricas de
  engajamento por meio de automação, ciclos de autoinstalação, contas falsas, atividade
  coordenada, engajamento pago ou outro comportamento não orgânico
- criar ou alternar contas para evitar moderação, banimentos, limites de editores ou
  análise do marketplace
- induzir os usuários ao erro sobre propriedade, fonte, recursos, postura de segurança,
  requisitos de instalação ou afiliação com outro projeto ou editor
- reenviar repetidamente conteúdo que já tenha sido ocultado, removido ou bloqueado
  sem corrigir o problema subjacente

A publicação em grande volume não é automaticamente um abuso. Catálogos grandes são aceitáveis
quando as listagens são significativamente diferentes, descritas com precisão, mantidas
e usadas por usuários reais. Catálogos grandes tornam-se um problema de confiança e segurança quando
o volume está associado a listagens superficiais, duplicadas, enganosas, sem manutenção ou
promovidas artificialmente.

## Direitos sobre conteúdo

Se você acredita que algum conteúdo no ClawHub viola seus direitos autorais ou outros direitos, use
[Solicitações de direitos sobre conteúdo](/clawhub/content-rights). Não use as denúncias normais do marketplace
para reivindicações de direitos autorais ou outros direitos, a menos que a listagem também seja insegura,
maliciosa ou enganosa.

## Análise e aplicação das regras

O ClawHub pode usar verificações automatizadas, sinais estatísticos de abuso, denúncias de usuários e
análise da equipe para identificar conteúdo inseguro ou comportamento de publicação abusivo. Um sinal,
por si só, não comprova abuso; ele ajuda o ClawHub a decidir o que precisa ser analisado.

Podemos:

- ocultar, reter, remover, excluir logicamente ou, quando houver suporte para o tipo de recurso,
  excluir permanentemente listagens que violem as regras
- bloquear downloads ou instalações de versões inseguras
- revogar tokens de API
- excluir logicamente conteúdo associado
- restringir o acesso à publicação
- banir infratores reincidentes ou graves

Não garantimos a emissão prévia de advertência em casos de abuso evidente. Consulte
[Moderação e segurança da conta](/clawhub/moderation) para obter informações sobre denúncias, retenções para moderação,
listagens ocultas, banimentos e situação da conta.
