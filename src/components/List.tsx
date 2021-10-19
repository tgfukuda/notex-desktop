import React from "react";
import {
  List as MuiList,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { ListType } from "../redux/write";
import ParseMd from "./ParseMd";

const useStyles = makeStyles((theme) => ({
  listRoot: (props: { indent: number }) => ({
    borderLeftWidth: "1.5px",
    borderLeftColor: "#2D5073",
    borderLeftStyle: "solid",
    paddingLeft: theme.spacing(props.indent + 1),
  }),
  listItemRoot: (props: { indent: number }) => ({
    width: "100%",
    paddingLeft: theme.spacing(props.indent + 1),
  }),
  listIcon: {
    minWidth: "0px",
  },
}));

type ListProps = {id: number; edit: boolean} & ListType
const List: React.FC<ListProps> = ({ id, type, items, header }) => {
  const classes = useStyles({ indent: 0 });
  return (
    <MuiList className={classes.listRoot}>
      {items.map((item) => (
        <ListItem
          classes={{
            root: classes.listItemRoot,
          }}
        >
          <ListItemIcon
            classes={{
              root: classes.listIcon,
            }}
          >
            ・
          </ListItemIcon>
          <ListItemText>
            <ParseMd str={item} id={id.toString()} type={type} />
          </ListItemText>
        </ListItem>
      ))}
    </MuiList>
  );
};

export default List;
