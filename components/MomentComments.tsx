"use client";

import GiscusComments from './GiscusComments';

interface MomentCommentsProps {
  id: string; // 必须传入说说的专属 ID
}

export default function MomentComments({ id }: MomentCommentsProps) {
  return (
    <div className="w-full relative">
      <GiscusComments pageId={id} />
    </div>
  );
}
