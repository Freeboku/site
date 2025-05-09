
import React from 'react';
import { motion } from 'framer-motion';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';

const PopupTableRow = ({ popup, onEdit, onDelete }) => {
  const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  return (
    <motion.tr variants={itemVariants} className="hover:bg-muted/20">
      <TableCell className="font-medium">{popup.title}</TableCell>
      <TableCell>
        <span className={`px-2 py-0.5 text-xs rounded-full ${popup.is_active ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
          {popup.is_active ? 'Active' : 'Inactive'}
        </span>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {popup.start_date ? new Date(popup.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
        {' - '}
        {popup.end_date ? new Date(popup.end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" onClick={() => onEdit(popup)} className="hover:text-primary mr-1" title="Modifier">
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(popup.id, popup.title)} className="hover:text-destructive" title="Supprimer">
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </motion.tr>
  );
};

export default PopupTableRow;
