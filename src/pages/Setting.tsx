/** @jsxImportSource @emotion/react */
import React, { useState } from "react";
import { css, useTheme, Theme } from "@emotion/react";
import {
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { SettingType, languages, Language } from "../redux/settings";
import { useAppDispatch, useSettings } from "../redux/hooks";
import { NoTeXSettings } from "../redux/settings";
import useCommand, { Response } from "../api/command";
import { useSnackHandler } from "../context/SnackHandler";
import utilMsg from "../utils/constant/util";
import settingMsg from "../utils/constant/setting";

const label = (theme: Theme) =>
  css({
    flex: "0 0 20%",
    display: "block",
    fontSize: theme.typography.fontSize * 1.5,
    fontWeight: theme.typography.fontWeightMedium,
  });

const labeled = (theme: Theme) =>
  css({
    flex: "0 0 77%",
    padding: theme.spacing(0.2),
  });

const Settings: React.FC = () => {
  const theme = useTheme();
  const { handleSuc, handleErr } = useSnackHandler();
  const [langOpen, setLangOpen] = useState(false);
  const dispatch = useAppDispatch();
  const [temp, setTemp] = useState<SettingType>(useSettings());
  const msgs = {
    ...utilMsg(temp.language),
    ...settingMsg(temp.language),
  };
  const { updateSetting } = useCommand();
  const handleUpdate = async () => {
    const res = await updateSetting(temp).catch((err) => {
      handleErr((err as Response).message);
      return undefined;
    });

    if (res) {
      handleSuc(res.message);
      dispatch(NoTeXSettings.setSettings(temp));
    }
  };

  return (
    <section
      css={css({
        width: "95vw",
        height: "80vh",
        margin: theme.spacing(1),
        padding: theme.spacing(2),
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        alignContent: "flex-start",
        border: "2px solid",
      })}
    >
      <Typography
        variant={"h2"}
        css={css({
          flex: "0 0 100%",
          margin: theme.spacing(2),
          padding: theme.spacing(0.2),
          borderBottom: "4px double",
        })}
      >
        {msgs.setting}
      </Typography>
      <span css={label}>{msgs.targetDir}</span>
      <TextField label={msgs.targetDir} value={temp.target_dir} css={labeled} />
      <span css={label}>{msgs.userName}</span>
      <TextField
        label={msgs.userName}
        defaultValue={temp.username}
        onBlur={(e) =>
          setTemp({
            ...temp,
            username: e.target.value,
          })
        }
        css={labeled}
      />
      <span css={label}>{msgs.passWord}</span>
      <TextField
        label={msgs.passWord}
        defaultValue={temp.password}
        onBlur={(e) =>
          setTemp({
            ...temp,
            password: e.target.value,
          })
        }
        css={labeled}
      />
      <span css={label}>{msgs.isPassEnabled}</span>
      <FormControlLabel
        control={
          <Switch
            checked={temp.is_pass_enabled}
            onChange={() =>
              setTemp({
                ...temp,
                is_pass_enabled: !temp.is_pass_enabled,
              })
            }
            name={"password_switch"}
          />
        }
        label={temp.is_pass_enabled ? msgs.enabled : msgs.disabled}
        css={[
          labeled,
          css({
            "& .MuiFormControlLabel-root": {
              borderBottom: "1px solid " + theme.palette.common.black,
            },
          }),
        ]}
      />
      <span css={label}>{msgs.language}</span>
      <Select
        id={"language_selector"}
        open={langOpen}
        onOpen={() => setLangOpen(true)}
        onClose={() => setLangOpen(false)}
        onChange={(e) =>
          setTemp({
            ...temp,
            language: e.target.value as Language,
          })
        }
        value={temp.language}
        css={labeled}
      >
        {languages.map((lng) => (
          <MenuItem value={lng} key={"language_selector_" + lng}>
            {lng}
          </MenuItem>
        ))}
      </Select>
      <Button
        onClick={handleUpdate}
        css={css({
          backgroundColor: theme.palette.success.main,
          color: theme.palette.text.primary,
          margin: "1rem 1rem 1rem auto",
          "&:hover": {
            backgroundColor: alpha(theme.palette.success.main, 0.5),
          },
        })}
      >
        {msgs.save}
      </Button>
    </section>
  );
};

export default Settings;
