import { InputOTP } from "@heroui/react";

interface TfaCodeInputProp {
  isInvalid?: boolean;
  errorMsg?: string;
  value?: string;
  onChange?: (value: string) => void
}

export function TfaCodeInput({isInvalid = false, value, onChange, errorMsg}: TfaCodeInputProp) {

  return (
    <>
      <InputOTP
        aria-describedby={isInvalid ? "code-error" : undefined}
        isInvalid={isInvalid}
        maxLength={6}
        name="code"
        value={value}
        onChange={onChange}
      >
        <InputOTP.Group>
          <InputOTP.Slot index={0} />
          <InputOTP.Slot index={1} />
          <InputOTP.Slot index={2} />
        </InputOTP.Group>
        <InputOTP.Separator />
        <InputOTP.Group>
          <InputOTP.Slot index={3} />
          <InputOTP.Slot index={4} />
          <InputOTP.Slot index={5} />
        </InputOTP.Group>
      </InputOTP>
      {isInvalid && 
        <span className="field-error" data-visible={true}>
          {errorMsg !== undefined? errorMsg : "Invalid code. Please try again."}
        </span>
      }
    </>
  )
}