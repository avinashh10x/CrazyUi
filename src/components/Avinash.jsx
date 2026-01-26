import { Frame, addPropertyControls, ControlType } from "framer";
import { useState, useEffect } from "react";

const copyFigmaToClipboard = (figmaCode) => {
  const htmlData = `
    <html>
      <head>
        <meta http-equiv="content-type" content="text/html; charset=utf-8">
      </head>
      <body>
        <!--StartFragment-->
        ${figmaCode}
        <!--EndFragment-->
      </body>
    </html>
  `;

  const blob = new Blob([htmlData], { type: "text/html" });
  const item = new ClipboardItem({ "text/html": blob });

  return navigator.clipboard
    .write([item])
    .then(() => {
      console.log("Figma component copied to clipboard!");
      return true;
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
      alert("Failed to copy Figma component.");
      return false;
    });
};

export function CopyFigmaComponentButton({
  figmaCode,
  buttonFontSize,
  buttonPadding,
  buttonBorderRadius,
  buttonBackground,
  buttonColor,
  hoverBackground,
  fontType,
  svgIcon,
  iconToggle,
  isPaid,
  style,
  width,
  height,
  background,
  ...rest
}) {
  const [isCopied, setIsCopied] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const paddingValues = buttonPadding
    .split(" ")
    .map((p) => `${p}px`)
    .join(" ");

  const buttonStyles = {
    fontSize: buttonFontSize,
    padding: paddingValues,
    borderRadius: buttonBorderRadius,
    background: buttonBackground,
    color: buttonColor,
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    fontFamily: fontType,
    transform: isCopied ? "scale(0.95)" : "scale(1)",
  };

  const disabledButtonStyles = {
    ...buttonStyles,
    cursor: "not-allowed",
    opacity: 0.6,
  };

  const textStyles = {
    transition: "opacity 0.2s ease",
    opacity: 1,
  };

  // Check auth token on load
  const hasToken = document.cookie
    .split(";")
    .some((item) => item.trim().startsWith("auth_token="));

  useEffect(() => {
    if (hasToken) {
      setIsMember(true);
    } else {
      setIsMember(false);
    }
  }, []);

  const handleCopy = async () => {
    if (!isMember) {
      window.location.href = "/pricing";
    } else {
      const success = await copyFigmaToClipboard(figmaCode);
      if (success) {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      }
    }
  };

  return (
    <Frame
      width={width || "100%"}
      height={height || "100%"}
      background={background || "none"}
      center
      style={{ padding: 0, ...style }}
      {...rest}
    >
      {isPaid ? (
        <>
          <button
            onClick={handleCopy}
            style={buttonStyles}
            onMouseEnter={(e) => {
              if (!isCopied) {
                e.currentTarget.style.background = hoverBackground;
              }
            }}
            onMouseLeave={(e) => {
              if (!isCopied) {
                e.currentTarget.style.background = buttonBackground;
              }
            }}
          >
            {iconToggle && svgIcon && !isCopied && (
              <span
                dangerouslySetInnerHTML={{ __html: svgIcon }}
                style={{ marginRight: "8px" }}
              />
            )}
            {isCopied && <span style={{ marginRight: "8px" }}>✓</span>}
            <span style={textStyles}>
              {isCopied ? "Copied!" : "Copy to Figma"}
            </span>
          </button>
        </>
      ) : (
        <>
          {isMember ? (
            <button
              onClick={handleCopy}
              style={buttonStyles}
              onMouseEnter={(e) => {
                if (!isCopied) {
                  e.currentTarget.style.background = hoverBackground;
                }
              }}
              onMouseLeave={(e) => {
                if (!isCopied) {
                  e.currentTarget.style.background = buttonBackground;
                }
              }}
            >
              {iconToggle && svgIcon && !isCopied && (
                <span
                  dangerouslySetInnerHTML={{ __html: svgIcon }}
                  style={{ marginRight: "8px" }}
                />
              )}
              {isCopied && <span style={{ marginRight: "8px" }}>✓</span>}
              <span style={textStyles}>
                {isCopied ? "Copied!" : "Copy to Figma"}
              </span>
            </button>
          ) : (
            <button
              onClick={handleCopy}
              style={disabledButtonStyles}
              onMouseEnter={(e) => {
                if (!isCopied) {
                  e.currentTarget.style.background = hoverBackground;
                }
              }}
              onMouseLeave={(e) => {
                if (!isCopied) {
                  e.currentTarget.style.background = buttonBackground;
                }
              }}
            >
              {iconToggle && svgIcon && !isCopied && (
                <span
                  dangerouslySetInnerHTML={{ __html: svgIcon }}
                  style={{ marginRight: "8px" }}
                />
              )}

              <span style={textStyles}>{"buy to Figma"}</span>
            </button>
          )}
        </>
      )}
    </Frame>
  );
}

addPropertyControls(CopyFigmaComponentButton, {
  figmaCode: {
    type: ControlType.String,
    title: "Figma Code",
    displayTextArea: true,
    defaultValue: `
<meta charset="utf-8">
<!--(figmeta)-->
<!--(figma)-->
<span style="white-space:pre-wrap;">
This is some text in the Figma component!
</span>
        `,
  },
  isPaid: {
    type: ControlType.Boolean,
    title: "Is Paid",
    defaultValue: false,
  },
  buttonFontSize: {
    type: ControlType.Number,
    title: "Font Size",
    defaultValue: 16,
  },
  buttonPadding: {
    type: ControlType.String,
    title: "Padding (top right bottom left)",
    defaultValue: "10 20 10 20",
  },
  buttonBorderRadius: {
    type: ControlType.Number,
    title: "Border Radius",
    defaultValue: 5,
  },
  buttonBackground: {
    type: ControlType.Color,
    title: "Background Color",
    defaultValue: "#09f",
  },
  hoverBackground: {
    type: ControlType.Color,
    title: "Hover Background Color",
    defaultValue: "#0073e6",
  },
  buttonColor: {
    type: ControlType.Color,
    title: "Text Color",
    defaultValue: "#fff",
  },
  fontType: {
    type: ControlType.String,
    title: "Font Type",
    defaultValue: "Arial, sans-serif",
  },
  svgIcon: {
    type: ControlType.String,
    title: "SVG Icon",
    displayTextArea: true,
    defaultValue:
      "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' viewBox='0 0 16 16'><path d='M3.5 0a.5.5 0 0 1 .5.5V1h9V.5a.5.5 0 0 1 1 0V1h1a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h1V.5a.5.5 0 0 1 .5-.5z'/></svg>",
  },
  iconToggle: {
    type: ControlType.Boolean,
    title: "Show Icon",
    defaultValue: true,
  },
});