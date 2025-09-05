import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { TemplateId, Templates } from '@/lib/templates'
import 'core-js/features/object/group-by.js'
import { Sparkles, Zap, Lock } from 'lucide-react'
import Image from 'next/image'
import { useFeatureFlag, useFeatureValue } from '@/hooks/use-edge-flags'

export function ChatPicker({
  templates,
  selectedTemplate,
  onSelectedTemplateChange,
  models,
  languageModel,
  onLanguageModelChange,
  isLoadingModels,
}: {
  templates: Templates
  selectedTemplate: 'auto' | TemplateId
  onSelectedTemplateChange: (template: 'auto' | TemplateId) => void
  models: LLMModel[]
  languageModel: LLMModelConfig
  onLanguageModelChange: (config: LLMModelConfig) => void
  isLoadingModels?: boolean
}) {
  // Feature flags
  const { enabled: hasBetaAiModels } = useFeatureFlag('beta-ai-models', false)
  const { value: userSubscriptionTier } = useFeatureValue<'free' | 'pro' | 'enterprise'>('subscription-tier', 'free')
  
  // Filter models based on beta access
  const filteredModels = models.filter(model => {
    if (model.isBeta) {
      return hasBetaAiModels || userSubscriptionTier === 'pro' || userSubscriptionTier === 'enterprise'
    }
    return true
  })
  
  return (
    <div className="flex items-center space-x-2">
      <div className="flex flex-col">
        <Select
          name="template"
          defaultValue={selectedTemplate}
          onValueChange={onSelectedTemplateChange}
        >
          <SelectTrigger className="whitespace-nowrap border-none shadow-none focus:ring-0 px-0 py-0 h-6 text-xs">
            <SelectValue placeholder="Select a persona" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectGroup>
              <SelectLabel>Persona</SelectLabel>
              <SelectItem value="auto">
                <div className="flex items-center space-x-2">
                  <Sparkles
                    className="flex text-[#a1a1aa]"
                    width={14}
                    height={14}
                  />
                  <span>Auto</span>
                </div>
              </SelectItem>
              {Object.entries(templates).map(([templateId, template]) => (
                <SelectItem key={templateId} value={templateId}>
                  <div className="flex items-center space-x-2">
                    <Image
                      className="flex"
                      src={`/thirdparty/templates/${templateId}.svg`}
                      alt={templateId}
                      width={14}
                      height={14}
                    />
                    <span>{template.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col">
        <Select
          name="languageModel"
          defaultValue={languageModel.model}
          onValueChange={(e) => onLanguageModelChange({ model: e })}
          disabled={isLoadingModels}
        >
          <SelectTrigger className="whitespace-nowrap border-none shadow-none focus:ring-0 px-0 py-0 h-6 text-xs">
            <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Language model"} />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(
              Object.groupBy(filteredModels, ({ provider }) => provider),
            ).map(([provider, models]) => (
              <SelectGroup key={provider}>
                <SelectLabel className="flex items-center gap-2">
                  {provider}
                  {hasBetaAiModels && (
                    <Badge variant="outline" className="text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      Beta Access
                    </Badge>
                  )}
                </SelectLabel>
                {models?.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center space-x-2">
                      <Image
                        className="flex"
                        src={`/thirdparty/logos/${model.providerId}.svg`}
                        alt={model.provider}
                        width={14}
                        height={14}
                      />
                      <span>{model.name}</span>
                      {model.isBeta && (
                        <Badge variant="secondary" className="text-xs ml-2">
                          Beta
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
            
            {/* Show locked beta models for free users */}
            {!hasBetaAiModels && userSubscriptionTier === 'free' && models.some(m => m.isBeta) && (
              <SelectGroup>
                <SelectLabel className="flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Beta Models (Pro Only)
                </SelectLabel>
                {models.filter(m => m.isBeta).slice(0, 3).map((model) => (
                  <SelectItem key={`locked-${model.id}`} value={`locked-${model.id}`} disabled>
                    <div className="flex items-center space-x-2 opacity-50">
                      <Image
                        className="flex"
                        src={`/thirdparty/logos/${model.providerId}.svg`}
                        alt={model.provider}
                        width={14}
                        height={14}
                      />
                      <span>{model.name}</span>
                      <Badge variant="outline" className="text-xs ml-2">
                        <Lock className="w-3 h-3 mr-1" />
                        Pro
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}